import request from 'supertest';
import { createApp } from '../../src/app';
import { InMemoryUrlRepository } from '../../src/repositories/InMemoryUrlRepository';
import { UrlService } from '../../src/services/UrlService';

describe('GET /api/statistic/:url_path', () => {
  const buildApp = () => {
    const repo = new InMemoryUrlRepository();
    const service = new UrlService(repo);
    return { app: createApp(service), service };
  };

    it('returns the entry with full metadata for a known short code', async () => {
      const { app, service } = buildApp();
      const { entry } = service.encode('https://example.com');

      const res = await request(app).get(`/api/statistic/${entry.shortCode}`).expect(200);

      expect(res.body).toEqual({
        success: true,
        data: {
          shortCode: entry.shortCode,
          shortUrl: `http://localhost:3000/${entry.shortCode}`,
          originalUrl: 'https://example.com',
        createdAt: expect.any(String),
        visits: 0,
        lastVisitedAt: null,
        lastUserAgent: null,
        lastReferer: null,
      },
    });
  });

  it('reflects visit counts after a redirect', async () => {
    const { app, service } = buildApp();
    const { entry } = service.encode('https://example.com');

    await request(app)
      .get(`/${entry.shortCode}`)
      .set('User-Agent', 'jest-test')
      .set('Referer', 'https://ref.example')
      .expect(302);

    const res = await request(app).get(`/api/statistic/${entry.shortCode}`).expect(200);
    expect(res.body.data.visits).toBe(1);
    expect(res.body.data.lastUserAgent).toBe('jest-test');
    expect(res.body.data.lastReferer).toBe('https://ref.example');
    expect(res.body.data.lastVisitedAt).toEqual(expect.any(String));
  });

  it('returns 404 for an unknown short code', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/api/statistic/zzzzzzz').expect(404);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: 'NOT_FOUND' },
    });
  });

  it('returns 400 for a malformed short code', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/api/statistic/abc').expect(400);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
  });
});
