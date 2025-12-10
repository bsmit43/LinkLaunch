import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { processQueueRoute } from './routes/processQueue.js';
import { generateContentRoute } from './routes/generateContent.js';
import { browserManager } from './lib/browserManager.js';

const fastify = Fastify({
  logger: true,
  trustProxy: true
});

await fastify.register(cors, { origin: true });

// Health check
fastify.get('/', async () => ({
  status: 'ok',
  service: 'linklaunch-worker',
  timestamp: new Date().toISOString()
}));

// Enhanced health check with browser status
fastify.get('/health', async () => {
  const browserStatus = browserManager.getStatus();
  return {
    status: browserStatus.browserConnected ? 'healthy' : 'degraded',
    browser: browserStatus,
    timestamp: new Date().toISOString()
  };
});

// Main routes
fastify.post('/process-queue', processQueueRoute);
fastify.post('/generate-content', generateContentRoute);

// Graceful shutdown handler
async function gracefulShutdown(signal) {
  console.log(`Received ${signal}, shutting down gracefully...`);

  try {
    // Stop accepting new requests
    await fastify.close();

    // Clean up browser resources
    await browserManager.shutdown();

    console.log('Graceful shutdown complete');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors - cleanup browser before exit
process.on('uncaughtException', async (err) => {
  console.error('Uncaught exception:', err);
  await browserManager.cleanup();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  // Don't exit, just log
});

// Start server
const port = process.env.PORT || 3000;
const host = '0.0.0.0';

try {
  await fastify.listen({ port, host });
  console.log(`Worker running on port ${port}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
