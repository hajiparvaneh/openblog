import { defineConfig } from 'astro/config';

const configuredSiteUrl = process.env.OPENBLOG_BASE_URL ?? process.env.SITE_URL ?? 'https://openblog.cc/';
const site = configuredSiteUrl.endsWith('/') ? configuredSiteUrl : `${configuredSiteUrl}/`;

export default defineConfig({
  // The community app is an explicit opt-in; the starter needs no Worker or secrets.
  srcDir: process.env.OPENBLOG_COMMUNITY === 'true' ? './src' : './src/starter',
  site,
  trailingSlash: 'never'
});
