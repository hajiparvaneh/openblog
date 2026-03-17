import { defineConfig } from 'astro/config';

const configuredSiteUrl = process.env.OPENBLOG_BASE_URL ?? process.env.SITE_URL ?? 'https://openblog.cc/';
const site = configuredSiteUrl.endsWith('/') ? configuredSiteUrl : `${configuredSiteUrl}/`;

export default defineConfig({
  site,
  trailingSlash: 'never'
});
