import request from 'supertest';
import { createApp } from '../../src/app';
import { InMemoryUrlRepository } from '../../src/repositories/InMemoryUrlRepository';
import { UrlService } from '../../src/services/UrlService';

describe('GET /api/decode', () => {
  const buildApp = () => {
    const repo = new InMemoryUrlRepository();
    const service = new UrlService(repo);
    return { app: createApp(service), service };
  };

    it('decodes a known short code passed via ?shortCode', async () => {
      const { app, service } = buildApp();
      const { entry } = service.encode('https://example.com');

      const res = await request(app)
        .get('/api/decode')
        .query({ shortCode: entry.shortCode })
        .expect(200);

      expect(res.body).toEqual({
        success: true,
        data: {
          shortCode: entry.shortCode,
          originalUrl: 'https://example.com',
          shortUrl: `http://localhost:3000/${entry.shortCode}`,
        },
      });
    });

    it('decodes a full short URL passed via ?url', async () => {
      const { app, service } = buildApp();
      const { entry } = service.encode('https://example.com');
      const fullShortUrl = `http://localhost:3000/${entry.shortCode}`;

      const res = await request(app).get('/api/decode').query({ url: fullShortUrl }).expect(200);

      expect(res.body.data.shortCode).toBe(entry.shortCode);
      expect(res.body.data.originalUrl).toBe('https://example.com');
    });

  it('returns 404 for an unknown short code', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/api/decode').query({ shortCode: 'zzzzzzz' }).expect(404);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: 'NOT_FOUND' },
    });
  });

  it('returns 400 when neither url nor shortCode is provided', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/api/decode').expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when shortCode has an invalid format', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/api/decode').query({ shortCode: 'abc' }).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when a full short URL contains an invalid short code', async () => {
    const { app } = buildApp();
    const res = await request(app)
      .get('/api/decode')
      .query({ url: 'http://localhost:3000/abc' })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
