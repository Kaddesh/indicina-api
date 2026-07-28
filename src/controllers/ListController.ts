import { NextFunction, Request, Response } from 'express';
import { UrlService } from '../services/UrlService';
import { ApiSuccess } from '../types/api.types';
import { UrlEntryView } from '../types/url.types';
import { toUrlEntryView } from '../utils/urlView';
import { ListQuery } from '../validators/list.schema';

/** 
 * HTTP layer for GET /api/list.
 * Responsibility: query the service and format the list response.
 * No business logic, no validation rules (handled by middleware).
  **/
export class ListController {
  constructor(private readonly urlService: UrlService) {}

  list = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { q } = req.query as ListQuery;
      const entries = this.urlService.list(q);
      const data: UrlEntryView[] = entries.map(toUrlEntryView);
      const body: ApiSuccess<{ count: number; items: UrlEntryView[] }> = {
        success: true,
        data: { count: data.length, items: data },
      };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  };
}

