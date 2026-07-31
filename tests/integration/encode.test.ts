import request from 'supertest';
import { createApp } from '../../src/app';
import { InMemoryUrlRepository } from '../../src/repositories/InMemoryUrlRepository';
import { UrlService } from '../../src/services/UrlService';

describe('POST /api/encode', () => {
  const buildApp = () => {
    const repo = new InMemoryUrlRepository();
    const service = new UrlService(repo);
    return createApp(service);
  };

  it('returns 201 with a short URL for a valid https URL', async () => {
    const res = await request(buildApp())
      .post('/api/encode')
      .send({ originalUrl: 'https://indicina.co' })
      .expect(201);

    expect(res.body).toMatchObject({
      success: true,
      data: {
        shortCode: expect.stringMatching(/^[23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ]{7}$/),
        shortUrl: expect.stringMatching(/\/[23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ]{7}$/),
        originalUrl: 'https://indicina.co',
      },
    });
    expect(res.body.data.createdAt).toBeTruthy();
  });

  it('returns 201 with a short URL for a valid http URL', async () => {
    const res = await request(buildApp())
      .post('/api/encode')
      .send({ originalUrl: 'http://example.com/path' })
      .expect(201);

    expect(res.body.data.originalUrl).toBe('http://example.com/path');
  });

  it('is idempotent — first encode returns 201, second returns 200', async () => {
    const app = buildApp();
    const first = await request(app)
      .post('/api/encode')
      .send({ originalUrl: 'https://example.com' })
      .expect(201);
    const second = await request(app)
      .post('/api/encode')
      .send({ originalUrl: 'https://example.com' })
      .expect(200);
    expect(first.body.data.shortCode).toBe(second.body.data.shortCode);
  });

  it('encodes different URLs to different short codes', async () => {
    const app = buildApp();
    const a = await request(app).post('/api/encode').send({ originalUrl: 'https://a.example' });
    const b = await request(app).post('/api/encode').send({ originalUrl: 'https://b.example' });
    expect(a.body.data.shortCode).not.toBe(b.body.data.shortCode);
  });

  it('returns 400 with structured errors when originalUrl is missing', async () => {
    const res = await request(buildApp()).post('/api/encode').send({}).expect(400);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });

  it('returns 400 when originalUrl is not a valid URL', async () => {
    const res = await request(buildApp())
      .post('/api/encode')
      .send({ originalUrl: 'not-a-url' })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when originalUrl uses a non-http(s) scheme', async () => {
    const res = await request(buildApp())
      .post('/api/encode')
      .send({ originalUrl: 'ftp://example.com' })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when originalUrl is an empty string', async () => {
    const res = await request(buildApp())
      .post('/api/encode')
      .send({ originalUrl: '' })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 JSON when the request body contains malformed JSON', async () => {
    const res = await request(buildApp())
      .post('/api/encode')
      .set('Content-Type', 'application/json')
      .send('{"originalUrl":')
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request body contains malformed JSON',
      },
    });
  });

  it('returns 413 JSON when the request body exceeds the configured size limit', async () => {
    const res = await request(buildApp())
      .post('/api/encode')
      .send({ originalUrl: `https://example.com/${'a'.repeat(110_000)}` })
      .expect(413);

    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request body is too large',
      },
    });
  });
});
