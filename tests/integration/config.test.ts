import request from 'supertest';
import { createApp } from '../../src/app';
import { config } from '../../src/config/env';
import { InMemoryUrlRepository } from '../../src/repositories/InMemoryUrlRepository';
import { UrlService } from '../../src/services/UrlService';

describe('runtime configuration', () => {
  const originalBaseUrl = config.baseUrl;

  afterEach(() => {
    config.baseUrl = originalBaseUrl;
  });

  it('uses configured baseUrl when building short URLs', async () => {
    config.baseUrl = 'https://sho.rt';
    const app = createApp(new UrlService(new InMemoryUrlRepository()));

    const res = await request(app)
      .post('/api/encode')
      .send({ originalUrl: 'https://example.com' })
      .expect(201);

    expect(res.body.data.shortUrl).toBe(`https://sho.rt/${res.body.data.shortCode}`);
  });
});
