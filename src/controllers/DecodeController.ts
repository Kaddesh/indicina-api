import { NextFunction, Request, Response } from 'express';
import { UrlService } from '../services/UrlService';
import { ApiSuccess } from '../types/api.types';
import { DecodeResponseData } from '../types/url.types';
import { extractShortCode } from '../utils/shortCode';
import { config } from '../config/env';
import { DecodeQuery } from '../validators/decode.schema';


/**
 * HTTP layer for get /api/decode.
 * Responsibility: query the service and format response.
 * No business logic, no validation rules (handled by middleware).
 */
export class DecodeController {
  constructor(private readonly urlService: UrlService) {}

  decode = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { url, shortCode } = req.query as DecodeQuery;
      const raw = url ?? shortCode ?? '';
      const code = extractShortCode(raw);
      const entry = this.urlService.decode(code);

      const data: DecodeResponseData = {
        shortCode: entry.shortCode,
        originalUrl: entry.originalUrl,
        shortUrl: `${config.baseUrl}/${entry.shortCode}`,
      };
      const body: ApiSuccess<DecodeResponseData> = { success: true, data };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  };
}

