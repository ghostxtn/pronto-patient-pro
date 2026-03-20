# Production And Local Routing Findings

## Production model

In real production, this app should not be accessed through Vite on port `5173` and should not rely on any `localhost` fallback behavior.

The intended production shape is:

1. Build the frontend with `vite build`.
2. Serve the generated static frontend from a web server or CDN.
3. Route clinic domains such as `clinic-a.example.com` and `clinic-b.example.com` to that frontend.
4. Proxy `/api` and `/uploads` to the backend.
5. Let the backend resolve the tenant from the incoming request host.

That means production tenant resolution is host-based:

- `clinic-a.example.com` -> frontend served for that domain
- browser calls `/api/...`
- backend reads the request host
- backend looks up `clinics.domain`
- backend scopes auth and data to that clinic

## Current local behavior

This repository currently behaves differently in local development:

- The README expects tenant access through `http://test-klinik.localhost:5173/`.
- Bare `http://test-klinik.localhost` goes to Docker nginx on port `80`, not to the Vite frontend.
- The nginx config returns `502` for `/` on purpose because the frontend is not deployed there yet.
- `http://localhost:5173/` still works because the frontend sends `X-Clinic-Domain: test-klinik.localhost` when the browser hostname is `localhost`.
- The backend also maps `localhost` to `test-klinik.localhost` in development.

So local tenant isolation is currently relaxed by design.

## Why the user saw 502

The user opened:

- `http://test-klinik.localhost`

But the working local frontend URL in this repo is:

- `http://test-klinik.localhost:5173/`

Without `:5173`, the request goes to nginx on port `80`, where `/` is configured to return `502`.

## Why login on localhost is possible

Logging in from `http://localhost:5173/` is currently expected, even though it weakens the domain-based development model.

Reason:

- frontend fallback: `localhost` -> `test-klinik.localhost`
- backend fallback: `localhost` -> `test-klinik.localhost`

Because of those fallbacks, `localhost:5173` effectively behaves like the `test-klinik` tenant in development.

## Production recommendation

For production, use real clinic domains and remove any `localhost` fallback behavior from the deployed environment.

For stricter local development, consider:

- requiring access only through `*.localhost:5173`
- removing the frontend `localhost` fallback
- removing the backend `localhost` fallback
- or serving the frontend behind local domain-based nginx so `http://test-klinik.localhost` works without the Vite port
