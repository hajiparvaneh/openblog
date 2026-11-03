import { defineConfig } from 'astro/config';
import openblogConfig from './openblog.config.ts';

const site = openblogConfig.siteUrl;
const base = openblogConfig.basePath === '/' ? '/' : openblogConfig.basePath;

export default defineConfig({
  // The community app is an explicit opt-in; the starter needs no Worker or secrets.
  srcDir: process.env.OPENBLOG_COMMUNITY === 'true' ? './src' : './src/starter',
  site,
  base,
  trailingSlash: 'never'
});
