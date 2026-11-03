import { defineConfig } from 'astro/config';
import openblogConfig from './openblog.config.ts';

export default defineConfig({
  site: openblogConfig.siteUrl,
  base: openblogConfig.basePath === '/' ? '/' : openblogConfig.basePath,
  trailingSlash: 'never'
});
