# Auth API

JWT-based authentication for SmartStock, built on Hono.

## Authors

| Layer | Owner |
|-------|-------|
| Foundation (config, hash, jwt, schema) | Kim Eduard Saludes |
| Routes + middleware (register/login/me) | Luraine Villaranda |
| Tests + docs | Hazel |

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | none | Create account, returns `{ token, user }` |
| POST | `/auth/login` | none | Authenticate, returns `{ token, user }` |
| POST | `/auth/logout` | none | Clears `auth_token` cookie |
| GET  | `/auth/me` | bearer or cookie | Returns current user |

### Register payload

```json
{
  "email": "[email protected]",
  "name": "Jane Doe",
  "password": "min8chars",
  "role": "staff"
}
```

`role` must be `"admin"` or `"staff"`. Password ≥ 8 chars.

### Login payload

```json
{ "email": "[email protected]", "password": "..." }
```

## Token

- HS256 JWT, secret from `JWT_SECRET` env (default: dev-only)
- TTL: 7 days (`JWT_EXPIRES_IN`)
- Send as `Authorization: Bearer <token>` **or** as the `auth_token` cookie

## Running locally

```bash
cd backend
npm install
npm run dev          # tsx watch on :3000
npm test             # vitest
JWT_SECRET=mysecret npm run dev
```

## Security notes

- Passwords stored as bcrypt hashes (rounds from `BCRYPT_ROUNDS`, default 10)
- JWT secret must be set via `JWT_SECRET` in any non-dev environment
- v1 uses an in-memory user store; v2 will use the `users` table from `db/auth_schema.sql`
- Login errors are identical for unknown-email vs wrong-password to prevent enumeration
