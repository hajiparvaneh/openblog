---
title: Dockerfile Best Practices for Node.js Apps
description: Build smaller, faster, and safer Node.js containers with practical Dockerfile best practices, multi-stage builds, and production-ready defaults.
date: 2026-03-08
---

A good Dockerfile improves build speed, image size, and security posture.

## Start with an appropriate base image

Choose a maintained Node.js LTS image. Slim variants often reduce attack surface and image size.

## Use multi-stage builds

Install dependencies and compile in one stage, then copy only runtime artifacts into a minimal final image.

Benefits include:

- Smaller production images
- Faster deployment transfer times
- Fewer unnecessary tools in runtime

## Cache dependencies efficiently

Copy `package.json` and lockfile first, run `npm ci`, then copy the app source. This maximizes Docker layer caching.

## Run as non-root

Use a non-root user in the final stage whenever possible.

## Example checklist

1. Pin Node major version.
2. Use `npm ci` for reproducible installs.
3. Add `.dockerignore` for `node_modules`, logs, and local artifacts.
4. Set `NODE_ENV=production` in runtime images.
5. Expose only required ports.

Container quality comes from repeatable builds and strict runtime minimalism.
