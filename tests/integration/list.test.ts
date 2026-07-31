import request from 'supertest';
import { createApp } from '../../src/app';
import { InMemoryUrlRepository } from '../../src/repositories/InMemoryUrlRepository';
import { UrlService } from '../../src/services/UrlService';

describe('GET /api/list', () => {
  const buildApp = () => {
    const repo = new InMemoryUrlRepository();
    const service = new UrlService(repo);
    return { app: createApp(service), service };
  };

  it('returns an empty list when no URLs are stored', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/api/list').expect(200);
    expect(res.body).toEqual({ success: true, data: { count: 0, items: [] } });
  });

  it('returns all stored entries with full metadata', async () => {
    const { app, service } = buildApp();
    const { entry: a } = service.encode('https://a.example');
    const { entry: b } = service.encode('https://b.example');

    const res = await request(app).get('/api/list').expect(200);

    expect(res.body.data.count).toBe(2);
    expect(res.body.data.items).toHaveLength(2);
    const codes = res.body.data.items.map((it: { shortCode: string }) => it.shortCode).sort();
    expect(codes).toEqual([a.shortCode, b.shortCode].sort());
    for (const item of res.body.data.items) {
      expect(item).toMatchObject({
        shortCode: expect.any(String),
        shortUrl: expect.any(String),
        originalUrl: expect.any(String),
        createdAt: expect.any(String),
        visits: 0,
        lastVisitedAt: null,
        lastUserAgent: null,
        lastReferer: null,
      });
    }
  });

  it('filters by ?q substring (case-insensitive)', async () => {
    const { app, service } = buildApp();
    service.encode('https://example.com/FOO');
    service.encode('https://example.com/bar');
    service.encode('https://other.com/foo');

    const res = await request(app).get('/api/list').query({ q: 'foo' }).expect(200);
    expect(res.body.data.count).toBe(2);
  });

  it('returns 400 when ?q is shorter than 3 characters', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/api/list').query({ q: 'fo' }).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when ?q contains only whitespace', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/api/list').query({ q: '   ' }).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns the most recently created entry first', async () => {
    const { app, service } = buildApp();
    const { entry: first } = service.encode('https://first.example');
    // Force createdAt ordering by sleeping briefly
    await new Promise((r) => setTimeout(r, 5));
    const { entry: second } = service.encode('https://second.example');

    const res = await request(app).get('/api/list').expect(200);
    expect(res.body.data.items[0].shortCode).toBe(second.shortCode);
    expect(res.body.data.items[1].shortCode).toBe(first.shortCode);
  });
});
