import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { processQueueRoute } from './routes/processQueue.js';
import { generateContentRoute } from './routes/generateContent.js';

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

// Health check endpoint for Render
fastify.get('/health', async () => ({
  status: 'healthy',
  timestamp: new Date().toISOString()
}));

// Main routes
fastify.post('/process-queue', processQueueRoute);
fastify.post('/generate-content', generateContentRoute);

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
