import cors from 'cors';
import express, { Express, NextFunction, Request, Response } from 'express';
import { RedirectController } from './controllers/RedirectController';
import { config } from './config/env';
import { NotFoundError } from './errors/NotFoundError';
import { errorHandler } from './middleware/errorHandler';
import { createRouter } from './routes';
import { UrlService } from './services/UrlService';

/**
 * Builds and wires the Express application.
 * Exposed as a factory so tests can build isolated app instances.
 */
export function createApp(urlService: UrlService): Express {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' } });
  });

  app.use('/api', createRouter(urlService));
  app.use('/api', notFoundHandler);

  // Root-level redirect: GET /:url_path -> 302 to original URL.
  const redirectController = new RedirectController(urlService);
  app.get('/:url_path', redirectController.redirect);

  app.use(notFoundHandler);

  // Global error handler — must be registered last.
  app.use(errorHandler);

  return app;
}

function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError('Route', req.originalUrl));
}
