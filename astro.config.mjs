import { defineConfig } from 'astro/config';
import openblogConfig from './openblog.config.ts';

export default defineConfig({
  site: openblogConfig.siteUrl,
  base: openblogConfig.basePath === '/' ? '/' : openblogConfig.basePath,
  trailingSlash: 'never',
  vite: {
    // Compile-time flag so landing CSS is not bundled into the blog home.
    define: {
      'import.meta.env.OPENBLOG_OFFICIAL_LANDING': JSON.stringify(
        process.env.OPENBLOG_OFFICIAL_LANDING === '1' ? '1' : ''
      )
    },
    server: {
      watch: {
        // Ensure new/edited Markdown posts invalidate routes in `astro dev`.
        ignored: ['!**/content/posts/**']
      }
    }
  }
});


