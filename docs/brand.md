# Brand

Set the site name, author, navigation, and images in two places: `openblog.config.ts` and `public/`.

## Config file

Edit [`openblog.config.ts`](../openblog.config.ts). The site reads this file at build time.

```ts
const config = {
  title: 'OpenBlog',
  tagline: 'A free open-source Markdown blog',
  description: 'One or two sentences for search and link previews.',
  heroHeadline: 'A free blog built from Markdown files on GitHub.',
  heroSupporting: 'A short paragraph under the home page headline.',
  accentColor: '#0969da',
  defaultTheme: 'light',
  author: {
    name: 'OpenBlog',
    url: 'https://github.com/hajiparvaneh/openblog',
    avatar: '/openblog-logo-light.png'
  }
};
```

| Field | Default in this repo | What it changes |
| --- | --- | --- |
| `title` | `OpenBlog` | Site name in the header, titles, and feeds |
| `tagline` | `A free open-source Markdown blog` | Short line beside the logo |
| `description` | See the config file | Home page description and social preview text |
| `heroHeadline` | See the config file | Home page heading |
| `heroSupporting` | See the config file | Paragraph under that heading |
| `accentColor` | `#0969da` | Accent color |
| `defaultTheme` | `light` | First theme for a new visitor. `dark` is the other value |
| `author.name` | `OpenBlog` | Byline when a post does not set `author` |
| `author.url` | The GitHub repository | Link on the default byline. Use `''` to show the name only |
| `author.avatar` | `/openblog-logo-light.png` | Image on the default byline |
| `nav` | Home, Archive, Search, About | Header links. `href` is a site path such as `/archive` |
| `footerLinks` | Now, Colophon, Uses | Extra footer links. Point them at pages in `content/pages/` |
| `footerText` | A short thank-you line | Sentence above the footer links |
| `repositoryUrl` | This GitHub repository | “Source” link in the footer. `''` hides it |
| `mastodonUrl` | `''` | Mastodon profile link. Empty hides it |
| `contentLicense.name` | `CC BY 4.0` | License label on posts and in the footer. `''` hides it |
| `contentLicense.url` | The CC BY 4.0 deed | License link. The template code stays MIT |
| `aboutMarkdownPath` | `content/about.md` | File used for the About page |
| `logo.light` | `/openblog-logo-light.png` | Logo on light surfaces |
| `logo.dark` | `/openblog-logo-dark.png` | Logo in the dark header |
| `favicon` | `/favicon.ico` | Browser icon |
| `appleTouchIcon` | `/apple-touch-icon.png` | Apple touch icon |
| `ogImage` | `/og-default.png` | Image used when a page has no other social image |

`siteUrl` and `basePath` in the same file are the local fallbacks. A deploy should set the public address with environment variables. See [Publish](publish.md).

## Images

Put replacement images in [`public/`](../public/). Paths in the config start with `/` and match a file in that folder.

| Config path | File |
| --- | --- |
| `/openblog-logo-light.png` | `public/openblog-logo-light.png` |
| `/openblog-logo-dark.png` | `public/openblog-logo-dark.png` |
| `/favicon.ico` | `public/favicon.ico` |
| `/apple-touch-icon.png` | `public/apple-touch-icon.png` |
| `/og-default.png` | `public/og-default.png` |

[`public/branding/README.md`](../public/branding/README.md) lists the source artwork used to produce those files.

Post images can also live in `public/`. Reference them from a post with a path such as `/images/cover.png`.
