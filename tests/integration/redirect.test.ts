import request from 'supertest';
import { createApp } from '../../src/app';
import { InMemoryUrlRepository } from '../../src/repositories/InMemoryUrlRepository';
import { UrlService } from '../../src/services/UrlService';

describe('GET /:url_path (redirect)', () => {
  const buildApp = () => {
    const repo = new InMemoryUrlRepository();
    const service = new UrlService(repo);
    return { app: createApp(service), service };
  };

  it('302-redirects to the original URL for a known short code', async () => {
    const { app, service } = buildApp();
    const { entry } = service.encode('https://indicina.co');

    const res = await request(app).get(`/${entry.shortCode}`).expect(302);
    expect(res.headers.location).toBe('https://indicina.co');
  });

  it('increments the visit counter on each redirect', async () => {
    const { app, service } = buildApp();
    const { entry } = service.encode('https://example.com');

    await request(app).get(`/${entry.shortCode}`).expect(302);
    await request(app).get(`/${entry.shortCode}`).expect(302);
    await request(app).get(`/${entry.shortCode}`).expect(302);

    const stats = await request(app).get(`/api/statistic/${entry.shortCode}`).expect(200);
    expect(stats.body.data.visits).toBe(3);
  });

  it('captures User-Agent and Referer headers on the visit', async () => {
    const { app, service } = buildApp();
    const { entry } = service.encode('https://example.com');

    await request(app)
      .get(`/${entry.shortCode}`)
      .set('User-Agent', 'integration-test/1.0')
      .set('Referer', 'https://twitter.com/some/post')
      .expect(302);

    const stats = await request(app).get(`/api/statistic/${entry.shortCode}`).expect(200);
    expect(stats.body.data.lastUserAgent).toBe('integration-test/1.0');
    expect(stats.body.data.lastReferer).toBe('https://twitter.com/some/post');
  });

  it('returns 404 JSON for an unknown short code', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/zzzzzzz').expect(404);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: 'NOT_FOUND' },
    });
  });

  it('returns 400 JSON for a malformed short code', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/abc').expect(400);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
  });

  it('returns 404 JSON for unmatched multi-segment routes', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/missing/path').expect(404);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: 'NOT_FOUND' },
    });
  });

  it('returns 404 JSON for unknown API routes', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/api/unknown').expect(404);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: 'NOT_FOUND' },
    });
  });

  it('does NOT match reserved paths like /api or /health', async () => {
    const { app } = buildApp();
    // /api and /health have their own handlers; the root redirect should not steal them.
    await request(app).get('/api/list').expect(200);
    await request(app).get('/health').expect(200);
  });
});
