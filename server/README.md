# Foxtail Contact Service

Node/Express backend for `foxtailinc.site`. Two routes:

- `POST /api/contact` — validates + rate-limits + emails a contact-form
  submission via SMTP. Nothing persisted.
- `POST /api/track` — logs a CTA button click (label + page) to
  `clicks.log` as append-only JSON lines. Server-side only, no route to
  read it back, no database.

## Run locally

```
cd server
npm install
cp .env.example .env   # fill in real SMTP values
npm start
```

Service listens on `127.0.0.1:3000` only — it's not meant to be reachable
directly, nginx reverse-proxies to it (see repo-root VPS notes once that
phase is set up).

## Environment variables

| Var | Purpose |
|---|---|
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (465 = implicit TLS, 587 = STARTTLS) |
| `SMTP_USER` | SMTP auth user — also used as the `from` address |
| `SMTP_PASS` | SMTP auth password |
| `CONTACT_TO` | Inbox that receives form submissions |

## Production (systemd)

`/etc/systemd/system/foxtail-contact.service`:

```ini
[Unit]
Description=Foxtail contact form service
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/foxtail-contact
ExecStart=/usr/bin/node server.js
EnvironmentFile=/var/www/foxtail-contact/.env
Restart=always
RestartSec=5
User=www-data

[Install]
WantedBy=multi-user.target
```

```
sudo systemctl daemon-reload
sudo systemctl enable --now foxtail-contact
sudo journalctl -u foxtail-contact -f   # logs / send failures land here
```

nginx should reverse-proxy `POST /api/contact` and `POST /api/track` on
`foxtailinc.site` to `http://127.0.0.1:3000` — full nginx config comes in
the VPS hosting phase.

`clicks.log` lands in `WorkingDirectory` (`/var/www/foxtail-contact/clicks.log`
in production) — `tail -f clicks.log` to watch clicks live.
