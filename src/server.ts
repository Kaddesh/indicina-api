import { createApp } from './app';
import { config } from './config/env';
import { InMemoryUrlRepository } from './repositories/InMemoryUrlRepository';
import { UrlService } from './services/UrlService';

/**
 * Composition root.
 * Wires concrete implementations of dependencies and starts the HTTP server.-
 */
const repository = new InMemoryUrlRepository();
const urlService = new UrlService(repository);
const app = createApp(urlService);

app.listen(config.port, () => {
  console.log(`ShortLink backend listening at ${config.baseUrl}`);
});

