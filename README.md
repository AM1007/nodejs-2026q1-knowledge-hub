# Knowledge Hub API

REST API for a Knowledge Hub platform built with NestJS, PostgreSQL, and Prisma ORM. Containerized with Docker. Includes AI-powered endpoints backed by Google Gemini.

## Prerequisites

- Node.js 24.x.x (24.10.0 or higher)
- npm
- Docker & Docker Compose
- A Google Gemini API key (see [AI Integration](#ai-integration))
- For RAG features: Qdrant vector database (started automatically via Docker Compose, see [RAG and Vector Database](#rag-and-vector-database))

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

| Variable                        | Description                              | Default                                     |
| ------------------------------- | ---------------------------------------- | ------------------------------------------- |
| `PORT`                          | Application port                         | `4000`                                      |
| `CRYPT_SALT`                    | Bcrypt salt rounds                       | `10`                                        |
| `JWT_SECRET_KEY`                | JWT access token secret                  | —                                           |
| `JWT_SECRET_REFRESH_KEY`        | JWT refresh token secret                 | —                                           |
| `TOKEN_EXPIRE_TIME`             | Access token TTL                         | `1h`                                        |
| `TOKEN_REFRESH_EXPIRE_TIME`     | Refresh token TTL                        | `24h`                                       |
| `POSTGRES_USER`                 | PostgreSQL username                      | `postgres`                                  |
| `POSTGRES_PASSWORD`             | PostgreSQL password                      | `postgres`                                  |
| `POSTGRES_DB`                   | PostgreSQL database name                 | `knowledge_hub`                             |
| `POSTGRES_HOST`                 | PostgreSQL host                          | `db`                                        |
| `POSTGRES_PORT`                 | PostgreSQL port                          | `5432`                                      |
| `DATABASE_URL`                  | Prisma connection string                 | —                                           |
| `GEMINI_API_KEY`                | Google Gemini API key                    | —                                           |
| `GEMINI_API_BASE_URL`           | Gemini API base URL                      | `https://generativelanguage.googleapis.com` |
| `GEMINI_MODEL`                  | Gemini model identifier                  | `gemini-2.0-flash`                          |
| `AI_RATE_LIMIT_RPM`             | Max AI requests per minute               | `20`                                        |
| `AI_CACHE_TTL_SEC`              | Cache TTL for AI responses (seconds)     | `300`                                       |
| `GEMINI_EMBEDDING_MODEL`        | Gemini model for embeddings              | `gemini-embedding-001`                      |
| `GEMINI_EMBEDDING_DIMENSIONS`   | Embedding vector dimensions              | `768`                                       |
| `RAG_VECTOR_DB_PROVIDER`        | Vector DB provider                       | `qdrant`                                    |
| `RAG_VECTOR_DB_URL`             | Vector DB URL                            | `http://vectordb:6333`                      |
| `RAG_VECTOR_COLLECTION`         | Vector collection name                   | `knowledge_hub_articles`                    |
| `RAG_CHUNK_SIZE`                | Chunk size in characters                 | `800`                                       |
| `RAG_CHUNK_OVERLAP`             | Overlap between chunks in characters     | `200`                                       |
| `RAG_TOP_K`                     | Default number of chunks to retrieve     | `5`                                         |
| `RAG_CONVERSATION_MAX_MESSAGES` | Max messages stored per RAG conversation | `20`                                        |

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

## Authentication

Most endpoints require a JWT access token. To obtain one:

```bash
# Sign up (creates a user with VIEWER role)
curl -X POST http://localhost:4000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"login":"yourlogin","password":"YourPass123!"}'

# Log in to get tokens
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"yourlogin","password":"YourPass123!"}'
```

The login response contains `accessToken` and `refreshToken`. Use the access token in the `Authorization: Bearer <token>` header for protected endpoints.

Tokens expire after one hour. Use `POST /auth/refresh` with the refresh token to obtain a new access token.

## API Endpoints

### Auth (`/auth`)

- `POST /auth/signup` — create new user
- `POST /auth/login` — get access and refresh tokens
- `POST /auth/refresh` — get a new access token using a refresh token
- `POST /auth/logout` — invalidate refresh token

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

### AI (`/ai`)

All AI endpoints (except `/ai/health`) require a valid JWT access token. They are rate-limited and counted in the usage tracker.

- `GET /ai/health` — liveness probe (public, no auth required)
- `GET /ai/usage` — current AI usage statistics (totals, per-endpoint counters, token usage)
- `POST /ai/articles/:articleId/summarize` — summarize an article (body: optional `maxLength: 'short' | 'medium' | 'detailed'`)
- `POST /ai/articles/:articleId/translate` — translate an article (body: required `targetLanguage`, optional `sourceLanguage`)
- `POST /ai/articles/:articleId/analyze` — analyze an article (body: optional `task: 'review' | 'bugs' | 'optimize' | 'explain'`)
- `POST /ai/generate` — free-form text generation (body: required `prompt`)

Detailed configuration and behavior are described in the [AI Integration](#ai-integration) section.

### RAG (`/ai/rag`)

All RAG endpoints require a valid JWT access token.

- `POST /ai/rag/index` — build or refresh the vector index from articles in the database (body: optional `onlyPublished: boolean` default `true`, optional `articleIds: string[]` for selective reindex)
- `POST /ai/rag/search` — semantic search in the indexed knowledge base (body: required `query`, optional `limit` 1-20, optional `articleStatus`, `categoryId`, `tags`)
- `POST /ai/rag/chat` — conversational RAG: retrieves relevant chunks, builds a grounded prompt, and returns an answer with source attribution (body: required `question`, optional `conversationId` for continuing an existing conversation)
- `DELETE /ai/rag/index/articles/:articleId` — remove all vector entries for a specific article (returns `204` on success, `404` if no entries are found)

Detailed configuration and behavior are described in the [RAG and Vector Database](#rag-and-vector-database) section.

### API Documentation

After starting the application, OpenAPI (Swagger) documentation is available at: `http://localhost:4000/doc`

## AI Integration

The Knowledge Hub API integrates with Google Gemini to provide AI-powered operations on articles.

### Getting a Gemini API key

1. Open [Google AI Studio](https://aistudio.google.com/).
2. Sign in with a Google account.
3. Go to **Get API key** in the left sidebar (or visit [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) directly).
4. Click **Create API key** and select an existing Google Cloud project, or let Google create a new one.
5. Copy the generated key — it is shown only once.

Paste the key into your local `.env` file as `GEMINI_API_KEY=...`. The `.env` file is git-ignored and must not be committed.

### Model used

The implementation reads the model from the `GEMINI_MODEL` environment variable. The default in `.env.example` is `gemini-2.0-flash` per the assignment specification, but the local development environment uses **`gemini-2.5-flash-lite`** because the free-tier quota for `gemini-2.0-flash` was unavailable in the development region.

Both models support `generateContent` and produce equivalent functional output for this assignment. To use a different Gemini model, change `GEMINI_MODEL` in `.env` and restart the server. No code changes are required.

To list models available to your API key:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY"
```

### Quick start for AI endpoints

After completing the steps in [Installation](#installation) and [Configuration](#configuration), and obtaining a Gemini API key:

1. Start the database:

   ```bash
   docker-compose up db -d
   ```

2. Apply migrations and seed:

   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

3. Start the application:

   ```bash
   npm run start:dev
   ```

4. Verify the AI module is loaded:

   ```bash
   curl http://localhost:4000/ai/health
   # → {"status":"ok"}
   ```

5. Obtain an access token (see [Authentication](#authentication)) and call an AI endpoint, for example:

   ```bash
   curl -X POST http://localhost:4000/ai/articles/<articleId>/summarize \
     -H "Authorization: Bearer <accessToken>" \
     -H "Content-Type: application/json" \
     -d '{"maxLength":"short"}'
   ```

### Behavior and configuration

- **Rate limiting.** AI endpoints are limited to `AI_RATE_LIMIT_RPM` requests per minute (default 20). When exceeded, the API returns `429 Too Many Requests` with a `Retry-After` header. The non-AI endpoints have a separate, more permissive limit.
- **Caching.** Responses for `summarize` and `translate` are cached in memory using a deterministic key based on `articleId`, request parameters, and the article's `updatedAt` timestamp. The TTL is configured via `AI_CACHE_TTL_SEC` (default 300 seconds). Cache is automatically invalidated when an article is updated, because `updatedAt` changes the cache key. `analyze` and `generate` results are not cached.
- **Error handling.** Network errors and timeouts (30 seconds) are retried up to three times with exponential backoff. Upstream `429` and `5xx` from Gemini are also retried. After all retries fail, the API returns `503 Service Unavailable`. Authentication errors from Gemini (`401`/`403`) return `500 Internal Server Error` without exposing the API key.
- **Usage tracking.** Total request count, per-endpoint counters, and Gemini token usage are tracked in memory since service startup, and exposed via `GET /ai/usage`. Cache hits do not increment counters, since they do not call Gemini.
- **Prompt templates.** Prompts for summarize, translate, and analyze are stored in `src/ai/prompts/` as builder functions. They are not hardcoded in controllers or services.

### Known limitations

- **Free-tier quota.** Google Gemini free tier enforces per-minute and daily limits on requests and tokens. During heavy testing the API may return `503` after retries fail on `429`. Wait 60–120 seconds and retry, or activate billing on your Google Cloud project for higher limits.
- **Latency.** Each non-cached AI request takes 2–10 seconds depending on the model and content size. Cache hits return in under 100 milliseconds.
- **Regional availability.** Some Gemini models are not available on free tier in all regions. If `gemini-2.0-flash` returns `429` with `limit: 0` immediately, switch to `gemini-2.5-flash-lite` via the `GEMINI_MODEL` environment variable.
- **In-memory state.** The cache and usage counters are not persistent. They are reset on every service restart. This is intentional per the assignment specification.
- **Analyze endpoint.** Gemini may occasionally return malformed JSON for the `analyze` task. The service includes a fallback that places the raw text into the `analysis` field with empty `suggestions` and `severity: "info"`.

## RAG and Vector Database

The RAG (Retrieval-Augmented Generation) layer enables semantic search and grounded conversational answers over the article corpus. Vectors are stored in a separate Qdrant container, alongside the application and PostgreSQL.

### Models used

- **Generation model:** `GEMINI_MODEL` (same as for non-RAG AI endpoints)
- **Embedding model:** `gemini-embedding-001` via the `:embedContent` endpoint, with `outputDimensionality=768` and matryoshka representation learning

If `gemini-embedding-001` is deprecated or replaced, change `GEMINI_EMBEDDING_MODEL` in `.env`. Note that changing the dimension requires recreating the Qdrant collection — the application will fail at startup with a clear error if the collection size does not match `GEMINI_EMBEDDING_DIMENSIONS`.

### Vector database (Qdrant)

The project uses [Qdrant](https://qdrant.tech) `v1.12.4` as the vector store. It runs as the `vectordb` service in `docker-compose.yml`:

- REST API on port `6333`, gRPC on port `6334`
- Persistent storage in the named volume `qdrant_data`
- Healthcheck via TCP probe; the application waits for `vectordb` to be healthy before starting

The application connects to Qdrant via `RAG_VECTOR_DB_URL`. Inside Docker Compose this resolves to `http://vectordb:6333`. When running the application locally with `npm run start:dev`, change it to `http://localhost:6333` in your `.env`.

### Quick start for RAG endpoints

After completing the steps in [Installation](#installation) and [Configuration](#configuration), and obtaining a Gemini API key:

1. Start the database and the vector store:

```bash
   docker-compose up db vectordb -d
```

2. Wait until both services are healthy:

```bash
   docker-compose ps db vectordb
```

3. Apply migrations and seed the database:

```bash
   npx prisma migrate dev
   npx prisma db seed
```

4. Start the application:

```bash
   npm run start:dev
```

5. Obtain an access token (see [Authentication](#authentication)).

6. Build the vector index from existing articles:

```bash
   curl -X POST http://localhost:4000/ai/rag/index \
     -H "Authorization: Bearer <accessToken>" \
     -H "Content-Type: application/json" \
     -d '{}'
   # → {"indexedArticles":2,"indexedChunks":2,"vectorCollection":"knowledge_hub_articles"}
```

7. Run a semantic search:

```bash
   curl -X POST http://localhost:4000/ai/rag/search \
     -H "Authorization: Bearer <accessToken>" \
     -H "Content-Type: application/json" \
     -d '{"query":"What JavaScript framework should I use?"}'
```

8. Ask a question with grounded answer and sources:

```bash
   curl -X POST http://localhost:4000/ai/rag/chat \
     -H "Authorization: Bearer <accessToken>" \
     -H "Content-Type: application/json" \
     -d '{"question":"What is NestJS?"}'
```

The response includes `answer`, `sources` (article id, title, the chunk used), and `conversationId`. Pass the same `conversationId` in subsequent requests to continue the conversation with memory.

### Behavior and configuration

- **Chunking.** Article content is split into character-based chunks of `RAG_CHUNK_SIZE` (default 800) with `RAG_CHUNK_OVERLAP` (default 200). Chunking rolls back to the nearest whitespace boundary to avoid breaking words. Chunking is deterministic — the same input always produces the same chunks.
- **Embeddings.** Each chunk is embedded with `taskType=RETRIEVAL_DOCUMENT`. Search queries are embedded with `taskType=RETRIEVAL_QUERY`. This asymmetry follows the Gemini guidance for RAG and improves retrieval quality compared to using the same task type for both.
- **Indexing strategy.** `POST /ai/rag/index` is idempotent. For each indexed article, all existing vectors with that `articleId` are deleted, then new chunks are inserted. Reindexing the same article does not produce duplicate vectors. Vector ids are deterministic UUIDv5 derived from `articleId:chunkIndex`.
- **Retrieval and filtering.** `POST /ai/rag/search` supports filtering by `articleStatus`, `categoryId`, and `tags` (any-match). Filters are pushed down to Qdrant payload filters and execute server-side, not as post-filtering in application code.
- **Source attribution.** `POST /ai/rag/chat` returns `sources` containing the actual chunks passed to the generation step, not a separate retrieval. This guarantees that the displayed sources are the ones the model used.
- **Conversation memory.** Conversations are kept in memory per `conversationId`. The last `RAG_CONVERSATION_MAX_MESSAGES` (default 20) messages are retained, oldest first removed. Each conversation has a 30-minute TTL. If `conversationId` is omitted, a new UUID is generated.
- **Grounded prompt.** The prompt explicitly instructs the model to answer only from the provided context and to say so if the context does not contain the answer. This minimizes hallucination at the cost of more "I don't know" responses.
- **Error handling.** When the vector DB or Gemini is unreachable or returns transient errors, the API returns `503 Service Unavailable`. Authentication errors (`401`/`403` from Gemini) return `500 Internal Server Error` without exposing the API key. Configuration mismatches (e.g. vector dimension mismatch on startup) cause the application to fail-fast with a clear log message.

### Known limitations

- **Free-tier quotas.** The same constraints as for non-RAG AI endpoints apply, plus an additional embedding call per chunk during indexing and per query during search. Indexing 100 long articles can consume significant daily token budget on the free tier.
- **Sequential embedding.** During indexing, chunks are embedded one at a time. For 100 articles with 5 chunks each, indexing takes ~5–10 minutes. Batching via `:batchEmbedContents` would be a meaningful optimization but is not implemented in this iteration.
- **No incremental indexing.** Every `POST /ai/rag/index` reindexes all matched articles, even if they have not changed since the last run. Production deployments should hook into article update events.
- **No re-ranking.** Top-K chunks from Qdrant are passed directly to the prompt. Adding a re-ranker (cross-encoder or LLM-based) would likely improve answer quality but is not implemented.
- **In-memory conversation store.** RAG conversations are not persisted. They are lost on application restart and not shared across replicas.
- **Vector schema migrations.** Changing the embedding model or dimensions requires manually recreating the Qdrant collection. The application detects mismatches at startup and refuses to run, but does not auto-migrate.

## Testing

The project includes both end-to-end (Jest) and unit (Vitest) tests.

End-to-end tests (require running database):

```bash
npm run test            # all e2e specs
npm run test:auth       # auth-related specs
npm run test:rbac       # RBAC specs
npm run test:refresh    # refresh-token specs
```

Unit tests:

```bash
npm run test:unit
npm run test:coverage   # with coverage report
```

## Security Scan

Tool: Docker Scout
Image: am1007/knowledge-hub:latest
Results: No critical or high vulnerabilities detected.

## Docker Hub

Docker image: [am1007/knowledge-hub](https://hub.docker.com/r/am1007/knowledge-hub)
