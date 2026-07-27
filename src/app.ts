import express, { Express } from 'express';
import { RedirectController } from './controllers/RedirectController';
import { errorHandler } from './middleware/errorHandler';
import { createRouter } from './routes';
import { UrlService } from './services/UrlService';

/**
 * Builds and wires the Express application.
 * Exposed as a factory so tests can build isolated app instances.
 */
export function createApp(urlService: UrlService): Express {
  const app = express();

  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' } });
  });

  app.use('/api', createRouter(urlService));

  
  // Global error handler — must be registered last.
  app.use(errorHandler);

  return app;
}

