import { NextFunction, Request, Response } from 'express';
import { UrlService } from '../services/UrlService';
import { ApiSuccess } from '../types/api.types';
import { UrlEntryView } from '../types/url.types';
import { toUrlEntryView } from '../utils/urlView';
import { assertValidShortCode } from '../utils/shortCode';

/** 
 * HTTP layer for GET /api/statistics:url-path.
 * Responsibility: query the service and format response.
 * No business logic, no validation rules (handled by middleware).
 **/
export class StatisticController {
  constructor(private readonly urlService: UrlService) {}

  getStatistics = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { url_path } = req.params;
      assertValidShortCode(url_path);
      const entry = this.urlService.getStatistics(url_path);
      const data: UrlEntryView = toUrlEntryView(entry);
      const body: ApiSuccess<UrlEntryView> = { success: true, data };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  };
}

