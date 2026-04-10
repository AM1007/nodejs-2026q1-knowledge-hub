# Knowledge Hub API

REST API for a Knowledge Hub platform built with Nest.js. Allows users to create, edit, and organize articles by categories and tags.

## Prerequisites

- Node.js 24.x.x (24.10.0 or higher)
- npm

## Installation

```bash
git clone https://github.com/AM1007/nodejs-2026q1-knowledge-hub.git
cd nodejs-2026q1-knowledge-hub
npm install
```

## Configuration

Create a `.env` file in the project root:

## Running the application

```bash
npm start
```

The application will start on `http://localhost:4000`.

## API Documentation

After starting the application, OpenAPI documentation is available at:

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

## Cascading behavior

- Deleting a User sets `authorId` to `null` in their articles and removes their comments
- Deleting a Category sets `categoryId` to `null` in associated articles
- Deleting an Article removes all associated comments

## Testing

Run all tests (application must be running):

```bash
npm run test
```

## Linting

```bash
npm run lint
```

## Docker Hub

Docker image: https://hub.docker.com/r/am1007/knowledge-hub
