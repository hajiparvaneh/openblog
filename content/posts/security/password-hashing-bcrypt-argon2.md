---
title: Password hashing with bcrypt and Argon2
description: Secure password storage with bcrypt or Argon2 — salting, cost factors, and common mistakes to avoid in web apps.
date: 2026-03-10
featured: true
lang: en
thumbnail: /og-default.png
thumbnailAlt: OpenBlog default social image
tags: [security, password-hashing, bcrypt, argon2]
---

Secure password storage starts with hashing, not encryption. A hash is one-way, so the original password cannot be directly recovered.

## Why plain hashes are not enough

Algorithms like SHA-256 are fast, which makes brute-force attacks easier. Password hashing must be intentionally slow and memory-hard.

## bcrypt vs Argon2

Both are widely used, but Argon2 is newer and designed for modern hardware threats.

- `bcrypt`: reliable, mature, easy to adopt
- `Argon2id`: recommended for new systems, better resistance against GPU cracking

## Essential implementation rules

1. Use a unique salt per password (modern libraries do this automatically).
2. Tune work factors so hashing is slow enough for attackers but acceptable for login UX.
3. Never store raw passwords, temporary logs, or reversible password data.
4. Rehash on login when cost settings are outdated.

## Common mistakes

- Using MD5/SHA-1/SHA-256 directly for password storage
- Sharing one global salt for all users
- Setting low work factors and never revisiting them

For most new applications, Argon2id is a strong default. If your stack already uses bcrypt safely, keep it updated and tuned.
