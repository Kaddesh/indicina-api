import { Router } from 'express';
import { EncodeController } from '../controllers/EncodeController';
import { validateBody } from '../middleware/validate';
import { UrlService } from '../services/UrlService';
import { encodeSchema } from '../validators/encode.schema';
import { validateQuery } from '../middleware/validateQuery';

/**
 * Wires controllers to routes.
 * The router receives its dependencies (the service) via factory injection,
 * which makes it trivial to swap a fake service in tests.
 */
export function createRouter(urlService: UrlService): Router {
  const router = Router();
  const encodeController = new EncodeController(urlService);
  
  router.post('/encode', validateBody(encodeSchema), encodeController.encode);
  

  return router;
}

