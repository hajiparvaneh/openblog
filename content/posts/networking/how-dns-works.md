---
title: How DNS Works
description: Understand DNS resolution end to end, including recursive lookup, caching, record types, and a practical OpenBlog example you can test with dig or nslookup.
date: 2026-03-12
thumbnail: https://cdn.pixabay.com/photo/2016/08/12/05/06/technology-1587673_1280.jpg
thumbnailAlt: Network infrastructure visualization with glowing technology lines
tags: dns, networking, internet, web, infrastructure
draft: false
featured: true
lang: en
---

DNS (Domain Name System) is the internet directory that maps a name like `openblog.cc` to an IP address a server can route to.
Without DNS, users would need to remember raw IPs for every site.

## Why DNS matters

- It makes websites human-friendly (`openblog.cc` instead of `203.0.113.10`).
- It allows infrastructure changes without changing user-facing URLs.
- It helps with routing email, verifying ownership, CDNs, and failover.

## Resolution flow (recursive lookup)

When you open `openblog.cc`, this is the typical path:

1. Your browser and OS check local caches first.
2. If not found, your device asks a recursive resolver (ISP, cloud DNS, or company DNS).
3. Resolver asks a root server, which points to the `.cc` TLD nameservers.
4. Resolver asks the `.cc` TLD nameserver, which points to the authoritative nameserver for `openblog.cc`.
5. Authoritative nameserver returns the final record (for example `A` or `AAAA`).
6. Resolver returns the answer to you and stores it for the record TTL.

## Common DNS record types

- `A`: hostname to IPv4 address
- `AAAA`: hostname to IPv6 address
- `CNAME`: alias from one hostname to another
- `MX`: mail server destination for a domain
- `TXT`: free-form text for verification and policies (SPF, DKIM, etc.)

## Caching and TTL

DNS answers are cached to reduce latency and load.
Each record has a `TTL` (time to live), which defines how long resolvers can keep a cached answer.
Lower TTL means faster propagation after changes but more DNS traffic.
Higher TTL improves performance but can slow rollout/rollback changes.

## OpenBlog example

Suppose OpenBlog moves to a new host.

- You can keep the same public URL (`openblog.cc`).
- Update DNS at the authoritative provider (for example the `A` record).
- Keep TTL moderate before migration, then increase later for stability.

Quick checks:

```bash
dig openblog.cc
dig www.openblog.cc
nslookup openblog.cc
```

You can also inspect record details:

```bash
dig openblog.cc A +noall +answer
dig openblog.cc AAAA +noall +answer
```

## Practical mistakes to avoid

- Setting very high TTL before planned infrastructure changes
- Mixing old and new records during migration without a clear cutover plan
- Forgetting `www` subdomain records while updating apex domain records
- Treating DNS propagation delay as “downtime” without validating cache behavior

DNS is simple at a high level, but production reliability depends on correct record design, cache strategy, and safe rollout practices.
