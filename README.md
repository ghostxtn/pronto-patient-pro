Local Tenant Development

This project uses domain-based tenant resolution.

Each clinic is mapped to a domain stored in the clinics.domain column.

For local development we use .localhost subdomains.

Example clinic mappings
test-klinik.localhost
yeni-klinik.localhost
Access the frontend
http://test-klinik.localhost:5173
http://yeni-klinik.localhost:5173
Backend tenant resolution

The backend reads the request host and resolves the clinic:

Host → normalize → lookup clinics.domain

Normalization rules:

lowercase

remove port

exact match

Example:

test-klinik.localhost:5173 → test-klinik.localhost