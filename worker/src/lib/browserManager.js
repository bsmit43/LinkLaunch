import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { homedir } from 'os';
import path from 'path';

/**
 * BrowserManager - Manages Lightpanda browser lifecycle with auto-recovery.
 *
 * Key features:
 * - Synchronizes browser instance with process state
 * - Health checks before each job
 * - Automatic reconnection with exponential backoff
 * - Graceful shutdown support
 */
class BrowserManager {
  constructor() {
    this.browserInstance = null;
    this.lightpandaProcess = null;
    this.isShuttingDown = false;
    this.maxConnectionAttempts = 3;
    this.lastHealthCheck = null;
  }

  /**
   * Find Lightpanda binary path
   */
  getLightpandaPath() {
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    // Go up from src/lib to worker root, then to bin
    const projectBin = path.join(__dirname, '..', '..', 'bin', 'lightpanda');

    const paths = [
      projectBin,
      path.join(process.cwd(), 'bin', 'lightpanda'),
      path.join(homedir(), '.lightpanda', 'lightpanda'),
      '/opt/render/.lightpanda/lightpanda',
      path.join(process.cwd(), 'lightpanda'),
      '/usr/local/bin/lightpanda'
    ];

    console.log('Searching for Lightpanda binary...');
    for (const p of paths) {
      // Normalize path for Windows compatibility
      const normalizedPath = p.replace(/^\/([A-Za-z]):/, '$1:');
      console.log(`  Checking: ${normalizedPath} - exists: ${existsSync(normalizedPath)}`);
      if (existsSync(normalizedPath)) {
        console.log(`Found Lightpanda at: ${normalizedPath}`);
        return normalizedPath;
      }
    }

    throw new Error(`Lightpanda binary not found. Searched: ${paths.join(', ')}`);
  }

  /**
   * Perform health check on browser connection
   */
  async healthCheck() {
    if (!this.browserInstance) {
      return { healthy: false, reason: 'No browser instance' };
    }

    if (!this.browserInstance.isConnected()) {
      return { healthy: false, reason: 'Browser disconnected' };
    }

    try {
      // Perform actual WebSocket ping by creating and closing a page
      const testPage = await Promise.race([
        this.browserInstance.newPage(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), 5000)
        )
      ]);
      await testPage.close();
      this.lastHealthCheck = Date.now();
      return { healthy: true };
    } catch (error) {
      return { healthy: false, reason: error.message };
    }
  }

  /**
   * Get browser instance, ensuring it's healthy
   */
  async ensureBrowser() {
    if (this.isShuttingDown) {
      throw new Error('Browser manager is shutting down');
    }

    // If we have a browser, verify it's actually healthy
    if (this.browserInstance) {
      const health = await this.healthCheck();
      if (health.healthy) {
        return this.browserInstance;
      }
      console.log(`Browser unhealthy: ${health.reason}. Reconnecting...`);
      await this.cleanup();
    }

    return await this.connectWithRetry();
  }

  /**
   * Connect to browser with retry logic
   */
  async connectWithRetry() {
    let lastError;

    for (let attempt = 1; attempt <= this.maxConnectionAttempts; attempt++) {
      try {
        console.log(`Browser connection attempt ${attempt}/${this.maxConnectionAttempts}`);
        await this.spawnLightpanda();
        await this.connectPuppeteer();
        return this.browserInstance;
      } catch (error) {
        lastError = error;
        console.error(`Connection attempt ${attempt} failed: ${error.message}`);

        await this.cleanup();

        if (attempt < this.maxConnectionAttempts) {
          const backoffMs = Math.pow(2, attempt - 1) * 1000;
          console.log(`Retrying in ${backoffMs}ms...`);
          await new Promise(r => setTimeout(r, backoffMs));
        }
      }
    }

    throw new Error(`Failed to connect after ${this.maxConnectionAttempts} attempts: ${lastError.message}`);
  }

  /**
   * Spawn Lightpanda process
   */
  async spawnLightpanda() {
    if (this.lightpandaProcess) {
      console.log('Lightpanda already running');
      return;
    }

    const lightpandaBin = this.getLightpandaPath();
    console.log(`Starting Lightpanda from ${lightpandaBin}...`);

    this.lightpandaProcess = spawn(
      lightpandaBin,
      ['serve', '--host', '127.0.0.1', '--port', '9222'],
      { stdio: ['ignore', 'pipe', 'pipe'] }
    );

    this.setupProcessHandlers();
    await this.waitForReady();
  }

  /**
   * Set up process event handlers - CRITICAL for state synchronization
   */
  setupProcessHandlers() {
    const proc = this.lightpandaProcess;

    proc.stdout.on('data', (data) => {
      console.log(`Lightpanda: ${data.toString().trim()}`);
    });

    proc.stderr.on('data', (data) => {
      console.error(`Lightpanda stderr: ${data.toString().trim()}`);
    });

    // CRITICAL: Invalidate BOTH process AND browser on exit
    proc.on('exit', (code, signal) => {
      console.log(`Lightpanda exited with code ${code}, signal ${signal}`);
      this.lightpandaProcess = null;
      this.browserInstance = null; // KEY FIX: invalidate browser too!
    });

    proc.on('error', (err) => {
      console.error('Lightpanda process error:', err);
      this.lightpandaProcess = null;
      this.browserInstance = null; // KEY FIX: invalidate browser too!
    });

    proc.on('close', (code) => {
      if (code !== 0 && !this.isShuttingDown) {
        console.error(`Lightpanda closed unexpectedly with code ${code}`);
      }
      this.lightpandaProcess = null;
      this.browserInstance = null;
    });
  }

  /**
   * Wait for Lightpanda to be ready
   */
  async waitForReady(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Lightpanda startup timeout'));
      }, timeoutMs);

      if (!this.lightpandaProcess) {
        clearTimeout(timeout);
        reject(new Error('Lightpanda process not running'));
        return;
      }

      const checkReady = (data) => {
        if (data.toString().includes('Listening')) {
          clearTimeout(timeout);
          this.lightpandaProcess.stdout.off('data', checkReady);
          resolve();
        }
      };

      this.lightpandaProcess.stdout.on('data', checkReady);

      // Fallback: resolve after 2 seconds if no explicit signal
      setTimeout(() => {
        this.lightpandaProcess?.stdout.off('data', checkReady);
        clearTimeout(timeout);
        resolve();
      }, 2000);
    });
  }

  /**
   * Connect Puppeteer to Lightpanda
   */
  async connectPuppeteer() {
    console.log('Connecting Puppeteer to Lightpanda...');

    this.browserInstance = await puppeteer.connect({
      browserWSEndpoint: 'ws://127.0.0.1:9222',
      timeout: 10000
    });

    this.browserInstance.on('disconnected', () => {
      console.log('Browser disconnected event received');
      this.browserInstance = null;
    });

    console.log('Connected to Lightpanda');
  }

  /**
   * Clean up browser resources
   */
  async cleanup() {
    console.log('Cleaning up browser resources...');

    if (this.browserInstance) {
      try {
        await this.browserInstance.close();
      } catch (e) {
        console.warn('Error closing browser:', e.message);
      }
      this.browserInstance = null;
    }

    if (this.lightpandaProcess) {
      try {
        this.lightpandaProcess.kill('SIGTERM');
        await new Promise(r => setTimeout(r, 1000));
        if (this.lightpandaProcess && !this.lightpandaProcess.killed) {
          this.lightpandaProcess.kill('SIGKILL');
        }
      } catch (e) {
        console.warn('Error killing Lightpanda:', e.message);
      }
      this.lightpandaProcess = null;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('Browser manager shutting down...');
    this.isShuttingDown = true;
    await this.cleanup();
  }

  /**
   * Get current status for health endpoint
   */
  getStatus() {
    return {
      browserConnected: this.browserInstance?.isConnected() ?? false,
      processRunning: this.lightpandaProcess !== null,
      lastHealthCheck: this.lastHealthCheck,
      isShuttingDown: this.isShuttingDown
    };
  }
}

// Export singleton instance
export const browserManager = new BrowserManager();
