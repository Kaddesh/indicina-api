import { NextFunction, Request, Response } from 'express';
import { config } from '../config/env';
import { UrlService } from '../services/UrlService';
import { ApiSuccess } from '../types/api.types';
import { EncodeInput } from '../validators/encode.schema';
import { EncodeResponseData } from '../types/url.types';

/**
 * HTTP layer for POST /api/encode.
 * Responsibility: parse request, call the service, format response.
 * No business logic, no validation rules (handled by middleware).
 */
export class EncodeController {
  constructor(private readonly urlService: UrlService) {}

  encode = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { originalUrl } = req.body as EncodeInput;
      const entry = this.urlService.encode(originalUrl);

      const data: EncodeResponseData = {
        shortCode: entry.shortCode,
        shortUrl: `${config.baseUrl}/${entry.shortCode}`,
        originalUrl: entry.originalUrl,
        createdAt: entry.createdAt.toISOString(),
      };
      const body: ApiSuccess<EncodeResponseData> = { success: true, data };
      res.status(201).json(body);
    } catch (err) {
      next(err);
    }
  };
}

