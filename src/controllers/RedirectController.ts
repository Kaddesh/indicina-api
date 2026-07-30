import { NextFunction, Request, Response } from 'express';
import { UrlService } from '../services/UrlService';
import { assertValidShortCode } from '../utils/shortCode';

/**
 * GET /:url_path
 * Records a visit and 302-redirects to the original URL.
 * 404 JSON if the short code is unknown (handled by global error middleware).
 */
export class RedirectController {
  constructor(private readonly urlService: UrlService) {}

  redirect = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { url_path } = req.params;
      assertValidShortCode(url_path);
      const entry = this.urlService.recordVisit(url_path, {
        visitedAt: new Date(),
        userAgent: req.get('user-agent') ?? undefined,
        referer: req.get('referer') ?? undefined,
      });
      res.redirect(302, entry.originalUrl);
    } catch (err) {
      next(err);
    }
  };
}

