import { Router } from 'express';
import { EncodeController } from '../controllers/EncodeController';
import { DecodeController } from '../controllers/DecodeController';
import { ListController } from '../controllers/ListController';
import { StatisticController } from '../controllers/StatisticController';
import { validateBody } from '../middleware/validate';
import { UrlService } from '../services/UrlService';
import { encodeSchema } from '../validators/encode.schema';
import { validateQuery } from '../middleware/validateQuery';

import { decodeQuerySchema } from '../validators/decode.schema';
import { listQuerySchema } from '../validators/list.schema';

/* Wires controllers to routes.
 * The router receives its dependencies (the service) via factory injection,
 * which makes it trivial to swap a fake service in tests.
 */
export function createRouter(urlService: UrlService): Router {
  const router = Router();
  const encodeController = new EncodeController(urlService);
  const decodeController = new DecodeController(urlService);
  const listController = new ListController(urlService);
  const statisticController = new StatisticController(urlService);

  router.post('/encode', validateBody(encodeSchema), encodeController.encode);
  router.get('/decode', validateQuery(decodeQuerySchema), decodeController.decode);
  router.get('/list', validateQuery(listQuerySchema), listController.list);
  router.get('/statistic/:url_path', statisticController.getStatistics);
  

  return router;
}

