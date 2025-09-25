# URL Shortener

A small Express + Postgres URL shortener with per-user link lists, QR tooltips and delete support.

This README explains how to run the project locally, set up the database, and troubleshoot common issues.

---

## Requirements

- Node.js 18+ (or compatible modern Node) installed
- PostgreSQL server (local or remote)
- npm (comes with Node)

## Quick start

1. Install dependencies

   ```bash
   npm install
   ```

2. Create a Postgres database (if you don't have one already)

   Connect to your Postgres server and run:

   ```sql
   CREATE DATABASE url_shortener;
   ```

3. Configure environment variables

   Copy or edit the `.env` file in the project root and set your database credentials. Example:

   ```ini
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password_here
   DB_NAME=url_shortener
   DATABASE_URL=postgresql://postgres:your_password_here@localhost:5432/url_shortener
   ```

   Note: `db.js` expects the `DB_*` variables above. The project uses ESM-style imports (`"type": "module"` in package.json) so the ESM-compatible dotenv import is used.

4. Create the database table (migration)

   Option A — run the SQL directly with psql:

   ```bash
   psql -h localhost -U postgres -d url_shortener -f schema.sql
   ```

   Option B — run the included Node migration script (uses `db.js` and your `.env`):

   ```bash
   node scripts/init_db.js
   ```

5. Start the app

   Development (nodemon):

   ```bash
   npm run dev
   ```

   Production:

   ```bash
   npm start
   ```

6. Open the app

   Visit: http://localhost:3000

---

## What the app provides

- A unified `main` view with a left sidebar showing the current user's shortened links, clicks, and expiry.
- A center form to create short URLs with selectable expiry options.
- Hover any shortened link to show a QR code for the original URL.
- Delete links (only allowed for the owner identified by the `user_id` cookie).

## Important files

- `server.js` — app entry and route wiring
- `db.js` — Postgres pool creation (reads `DB_*` env variables)
- `controllers/urlController.js` — main app logic for create/redirect/list/delete
- `routes/urlRoutes.js` — routing for shorten, redirect and delete
- `views/main.ejs` — single unified view for the whole UI
- `schema.sql` — canonical database schema for the `urls` table
- `scripts/init_db.js` — helper script to apply the `migrations/001_create_urls_table.sql` (or `schema.sql`)

## Database schema (quick)

The schema contains a single `urls` table with these key columns:

- `id` (serial primary key)
- `short_id` (unique short ID)
- `original_url` (text)
- `user_id` (string stored from cookie)
- `clicks` (integer)
- `created_at` / `expires_at` (timestamps)

See `schema.sql` for the full CREATE TABLE statement and indexes.

## Troubleshooting

- Error: `require is not defined in ES module scope` — ensure `db.js` uses `import 'dotenv/config'` and the project `package.json` has `"type":"module"`.
- Error: `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string` — means `pg` received a non-string password. Confirm your `.env` uses `DB_PASSWORD` (string) and `db.js` is reading it. Also check you didn't accidentally set the password to a non-string value in your environment.
- Error: `relation "urls" does not exist` — the `urls` table is missing. Run the migration:

  ```bash
  node scripts/init_db.js
  # or
  psql -h localhost -U postgres -d url_shortener -f schema.sql
  ```

- If you see permission errors deleting rows, make sure the `user_id` cookie is present (the app sets it automatically on first visit). The delete action is restricted to the owner by that cookie.

## Development notes

- The left list shows only links created by the current browser (identified using a `user_id` cookie). If you open the app in a new private window it will create a different `user_id` and you will see an empty list.
- QR codes are generated server-side as data URLs. If a user has many links, consider caching the QR data or generating it on demand to reduce CPU.


