# Secure Redirect Gateway

Next.js gateway for one legacy fixed destination and additional JSON-managed destinations.

## Routes

- `/`: legacy gateway. It uses `REDIRECT_DESTINATION`.
- `/v/[id]`: public verification gateway for an entry in `config/destinations.json`.
- `/r`: internal redirect endpoint. It consumes a short-lived signed session cookie and should not be shared as a public entry link.
- `/api/verify`: verifies the reCAPTCHA token and creates the redirect session.
- `/api/challenge`: reserved endpoint; currently returns 405 because challenge creation is not implemented.

## Destination configuration

The legacy destination remains in environment variables:

```dotenv
REDIRECT_DESTINATION=https://destination.example.com
REDIRECT_ALLOWED_HOSTS=destination.example.com
```

Additional destinations use `config/destinations.json`:

```json
{
  "unique-id": {
    "name": "Nama Situs",
    "url": "https://destination.example.com"
  }
}
```

The public URL is:

```text
https://your-verification-domain/v/unique-id
```

Only HTTPS URLs without embedded username/password are accepted. The ID and resulting URL are both validated by server code.

## Environment variables

```dotenv
APP_ORIGIN=https://your-verification-domain
REDIRECT_DESTINATION=https://legacy-destination.example.com
REDIRECT_ALLOWED_HOSTS=legacy-destination.example.com
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_public_site_key
RECAPTCHA_SECRET_KEY=your_private_secret_key
RECAPTCHA_ALLOWED_HOSTNAMES=your-verification-domain
SESSION_SECRET=replace-with-a-random-secret-of-at-least-32-bytes
```

Generate `SESSION_SECRET` with:

```bash
openssl rand -base64 32
```

Never commit real secrets or prefix server secrets with `NEXT_PUBLIC_`.

## Flow

1. Open `/` for the legacy destination or `/v/[id]` for a JSON destination.
2. Complete reCAPTCHA.
3. `/api/verify` validates the request, reCAPTCHA result, hostname, and destination ID.
4. The server creates an HttpOnly, signed redirect-session cookie for `/r`.
5. `/r` validates the session and redirects only to the server-selected URL.

The redirect session lasts 120 seconds and is cleared after use.
