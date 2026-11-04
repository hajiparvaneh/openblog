# Brand

[All guides](README.md) · [Start](start.md) · **Brand** · [Posts](posts.md) · [Pages](pages.md) · [Publish](publish.md) · [Layout](layout.md)

Set the site name, author, navigation, and images in two places: [`openblog.config.ts`](../openblog.config.ts) and [`public/`](../public/).

On this page: [Config file](#config-file) · [Navigation and footer](#navigation-and-footer) · [Images](#images) · [Theme and license](#theme-and-license)

## Config file

The site reads [`openblog.config.ts`](../openblog.config.ts) at build time.

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
    name: 'Ada',
    url: 'https://example.com',
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
| `author.name` | `OpenBlog` | Byline when a post does not set [`author`](posts.md#all-fields) |
| `author.url` | The GitHub repository | Link on the default byline. Use `''` to show the name only |
| `author.avatar` | `/openblog-logo-light.png` | Image on the default byline. The file lives in [`public/`](#images) |
| `aboutMarkdownPath` | `content/about.md` | File used for the About page. See [Pages](pages.md#about) |

`siteUrl` and `basePath` in the same file are local fallbacks. A deploy should set the public address with environment variables. See [Publish → Public URL](publish.md#public-url).

## Navigation and footer

`nav` is the header. `href` is a site path. The built-in routes are listed in [Layout → Routes](layout.md#routes).

```ts
nav: [
  { label: 'Home', href: '/' },
  { label: 'Archive', href: '/archive' },
  { label: 'Search', href: '/search' },
  { label: 'About', href: '/about' }
]
```

`footerLinks` points at extra Markdown pages. Create the file first, then add the link. See [Pages → Extra pages](pages.md#extra-pages).

```ts
footerLinks: [
  { label: 'Now', href: '/now' },
  { label: 'Colophon', href: '/colophon' }
],
footerText: 'Thanks for reading.'
```

| Field | Default in this repo | What it changes |
| --- | --- | --- |
| `nav` | Home, Archive, Search, About | Header links |
| `footerLinks` | Now, Colophon, Uses | Extra footer links |
| `footerText` | A short thank-you line | Sentence above the footer links |
| `repositoryUrl` | This GitHub repository | “Source” link in the footer. `''` hides it |
| `mastodonUrl` | `''` | Mastodon profile link. Empty hides it |

## Images

Put replacement images in [`public/`](../public/). A config path starts with `/` and matches a file in that folder.

| Config path | File | Used for |
| --- | --- | --- |
| `/openblog-logo-light.png` | `public/openblog-logo-light.png` | Logo on light surfaces (`logo.light`) |
| `/openblog-logo-dark.png` | `public/openblog-logo-dark.png` | Logo in the dark header (`logo.dark`) |
| `/favicon.ico` | `public/favicon.ico` | Browser icon (`favicon`) |
| `/apple-touch-icon.png` | `public/apple-touch-icon.png` | Apple touch icon |
| `/og-default.png` | `public/og-default.png` | Social image when a page has no other (`ogImage`) |

[`public/branding/README.md`](../public/branding/README.md) lists the source artwork used to produce those files.

A post thumbnail is a separate image. Reference it from the post as `/images/cover.png` or as a full image URL. See [Posts → All fields](posts.md#all-fields).

## Theme and license

| Field | Default | What it changes |
| --- | --- | --- |
| `accentColor` | `#0969da` | Accent color |
| `defaultTheme` | `light` | First theme for a new visitor. `dark` is the other value |
| `contentLicense.name` | `CC BY 4.0` | License label on each post and in the footer. `''` hides it |
| `contentLicense.url` | The CC BY 4.0 deed | License link |

The template code stays MIT. The content license applies to post text. A post can still set its own [`canonical`](posts.md#all-fields) when the writing was first published somewhere else.

[← Start](start.md) · [All guides](README.md) · [Posts →](posts.md)
