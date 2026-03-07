# Upload Server

A REST API for image uploads built with Fastify, TypeScript, PostgreSQL, and Cloudflare R2.

## Features

- Image upload to Cloudflare R2 (S3-compatible storage)
- Paginated upload listing with sorting
- CSV export of upload records
- OpenAPI docs via Swagger UI at `/docs`

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Fastify
- **Database:** PostgreSQL + Drizzle ORM
- **Storage:** Cloudflare R2 (AWS S3 SDK)
- **Validation:** Zod
- **Testing:** Vitest

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- PostgreSQL instance
- Cloudflare R2 bucket

### Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create a `.env` file with the required variables:
   ```env
   PORT=3333
   NODE_ENV=development
   DATABASE_URL=postgresql://user:password@localhost:5432/dbname

   CLOUDFLARE_ACCOUNT_ID=
   CLOUDFLARE_ACCESS_KEY_ID=
   CLOUDFLARE_SECRET_ACCESS_KEY=
   CLOUDFLARE_BUCKET=
   CLOUDFLARE_PUBLIC_URL=
   ```

3. Run database migrations:
   ```bash
   pnpm db:migrate
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/uploads` | Upload an image file |
| `GET` | `/uploads` | List uploads (paginated) |
| `GET` | `/uploads/export` | Export uploads as CSV |

Full interactive docs available at `http://localhost:3333/docs`.

## Testing

```bash
# Run tests once
pnpm test

# Watch mode
pnpm test:watch
```

Tests require a `.env.test` file with a separate test database URL.

## Database

```bash
pnpm db:generate   # Generate migrations
pnpm db:migrate    # Apply migrations
pnpm db:studio     # Open Drizzle Studio
```
