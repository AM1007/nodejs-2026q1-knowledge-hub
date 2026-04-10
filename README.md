# Knowledge Hub API

REST API for a Knowledge Hub platform built with NestJS, PostgreSQL, and Prisma ORM. Containerized with Docker.

## Prerequisites

- Node.js 24.x.x (24.10.0 or higher)
- npm
- Docker & Docker Compose

## Installation

```bash
git clone https://github.com/AM1007/nodejs-2026q1-knowledge-hub.git
cd nodejs-2026q1-knowledge-hub
npm install
```

## Configuration

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Environment variables:

| Variable                    | Description              | Default         |
| --------------------------- | ------------------------ | --------------- |
| `PORT`                      | Application port         | `4000`          |
| `CRYPT_SALT`                | Bcrypt salt rounds       | `10`            |
| `JWT_SECRET_KEY`            | JWT access token secret  | —               |
| `JWT_SECRET_REFRESH_KEY`    | JWT refresh token secret | —               |
| `TOKEN_EXPIRE_TIME`         | Access token TTL         | `1h`            |
| `TOKEN_REFRESH_EXPIRE_TIME` | Refresh token TTL        | `24h`           |
| `POSTGRES_USER`             | PostgreSQL username      | `postgres`      |
| `POSTGRES_PASSWORD`         | PostgreSQL password      | `postgres`      |
| `POSTGRES_DB`               | PostgreSQL database name | `knowledge_hub` |
| `POSTGRES_HOST`             | PostgreSQL host          | `db`            |
| `POSTGRES_PORT`             | PostgreSQL port          | `5432`          |
| `DATABASE_URL`              | Prisma connection string | —               |

## Running with Docker

Start all services (app + PostgreSQL):

```bash
docker-compose up --build
```

Start with Adminer (DB management UI on `http://localhost:8080`):

```bash
docker-compose --profile debug up --build
```

Stop all services:

```bash
docker-compose down
```

## Running locally (development)

Start only the database container:

```bash
docker-compose up db -d
```

Update `DATABASE_URL` in `.env` to use `localhost`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/knowledge_hub?schema=public&connection_limit=10"
```

Run migrations and seed:

```bash
npx prisma migrate dev
npx prisma db seed
```

Start the application:

```bash
npm run start:dev
```

The application will be available at `http://localhost:4000`.

## Database

### Prisma commands

| Command                    | Description                 |
| -------------------------- | --------------------------- |
| `npx prisma migrate dev`   | Create and apply migrations |
| `npx prisma migrate reset` | Reset DB and re-run seed    |
| `npx prisma db seed`       | Run seed script             |
| `npx prisma studio`        | Open visual DB editor       |
| `npx prisma generate`      | Regenerate Prisma Client    |

### Data model

- **User** — id, login, password, role (ADMIN, EDITOR, VIEWER)
- **Article** — id, title, content, status (DRAFT, PUBLISHED, ARCHIVED), authorId, categoryId
- **Category** — id, name, description
- **Comment** — id, content, articleId, authorId
- **Tag** — id, name (unique), many-to-many with Article

### Cascading behavior

- Deleting a User sets `authorId` to `null` in their articles and removes their comments
- Deleting a Category sets `categoryId` to `null` in associated articles
- Deleting an Article removes all associated comments and tag relations

## API Endpoints

### Users (`/user`)

- `GET /user` — get all users
- `GET /user/:id` — get user by id
- `POST /user` — create user (body: `login`, `password`, optional `role`)
- `PUT /user/:id` — update password (body: `oldPassword`, `newPassword`)
- `DELETE /user/:id` — delete user

### Articles (`/article`)

- `GET /article` — get all articles (optional filters: `status`, `categoryId`, `tag`)
- `GET /article/:id` — get article by id
- `POST /article` — create article (body: `title`, `content`, optional `status`, `authorId`, `categoryId`, `tags`)
- `PUT /article/:id` — update article
- `DELETE /article/:id` — delete article

### Categories (`/category`)

- `GET /category` — get all categories
- `GET /category/:id` — get category by id
- `POST /category` — create category (body: `name`, `description`)
- `PUT /category/:id` — update category
- `DELETE /category/:id` — delete category

### Comments (`/comment`)

- `GET /comment?articleId={articleId}` — get comments for an article
- `GET /comment/:id` — get comment by id
- `POST /comment` — create comment (body: `content`, `articleId`, optional `authorId`)
- `DELETE /comment/:id` — delete comment

### API Documentation

After starting the application, OpenAPI (Swagger) documentation is available at: `http://localhost:4000/doc`

## Testing

Run all tests (application must be running):

```bash
npm run test
```

## Security Scan

Tool: Docker Scout
Image: am1007/knowledge-hub:latest
Results: No critical or high vulnerabilities detected.

## Docker Hub

Docker image: [am1007/knowledge-hub](https://hub.docker.com/r/am1007/knowledge-hub)
