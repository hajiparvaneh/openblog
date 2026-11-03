import { defineConfig } from 'astro/config';
import openblogConfig from './openblog.config.ts';

export default defineConfig({
  site: openblogConfig.siteUrl,
  base: openblogConfig.basePath === '/' ? '/' : openblogConfig.basePath,
  trailingSlash: 'never',
  vite: {
    server: {
      watch: {
        // Ensure new/edited Markdown posts invalidate routes in `astro dev`.
        ignored: ['!**/content/posts/**']
      }
    }
  }
});

