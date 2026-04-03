import { request } from './lib';
import { StatusCodes } from 'http-status-codes';
import {
  getTokenAndUserId,
  shouldAuthorizationBeTested,
  removeTokenUser,
} from './utils';
import {
  usersRoutes,
  articlesRoutes,
  categoriesRoutes,
  commentsRoutes,
} from './endpoints';

describe('Additional tests (e2e)', () => {
  const commonHeaders = { Accept: 'application/json' };
  let mockUserId: string | undefined;

  beforeAll(async () => {
    if (shouldAuthorizationBeTested) {
      const result = await getTokenAndUserId(request);
      commonHeaders['Authorization'] = result.token;
      mockUserId = result.mockUserId;
    }
  });

  afterAll(async () => {
    if (mockUserId) {
      await removeTokenUser(request, mockUserId, commonHeaders);
    }
    if (commonHeaders['Authorization']) {
      delete commonHeaders['Authorization'];
    }
  });

  describe('User - role defaults to viewer', () => {
    it('should default role to viewer when not provided', async () => {
      const response = await request
        .post(usersRoutes.create)
        .set(commonHeaders)
        .send({ login: 'DEFAULT_ROLE_USER', password: 'pass123' });

      expect(response.status).toBe(StatusCodes.CREATED);
      expect(response.body.role).toBe('viewer');

      await request
        .delete(usersRoutes.delete(response.body.id))
        .set(commonHeaders);
    });
  });

  describe('User - password not exposed', () => {
    it('should not include password in GET all response', async () => {
      const createRes = await request
        .post(usersRoutes.create)
        .set(commonHeaders)
        .send({ login: 'NO_PASS_USER', password: 'secret' });

      const userId = createRes.body.id;

      const response = await request.get(usersRoutes.getAll).set(commonHeaders);

      expect(response.status).toBe(StatusCodes.OK);
      const user = response.body.find((u) => u.id === userId);
      expect(user).toBeDefined();
      expect(user).not.toHaveProperty('password');

      await request.delete(usersRoutes.delete(userId)).set(commonHeaders);
    });
  });

  describe('Article - default values', () => {
    it('should default status to draft and tags to empty array', async () => {
      const response = await request
        .post(articlesRoutes.create)
        .set(commonHeaders)
        .send({ title: 'Defaults Test', content: 'Testing defaults' });

      expect(response.status).toBe(StatusCodes.CREATED);
      expect(response.body.status).toBe('draft');
      expect(response.body.tags).toEqual([]);
      expect(response.body.authorId).toBeNull();
      expect(response.body.categoryId).toBeNull();

      await request
        .delete(articlesRoutes.delete(response.body.id))
        .set(commonHeaders);
    });
  });

  describe('Article - multiple filters combined', () => {
    it('should filter by status and tag simultaneously', async () => {
      const article1 = await request
        .post(articlesRoutes.create)
        .set(commonHeaders)
        .send({ title: 'A1', content: 'c', status: 'published', tags: ['js'] });

      const article2 = await request
        .post(articlesRoutes.create)
        .set(commonHeaders)
        .send({ title: 'A2', content: 'c', status: 'draft', tags: ['js'] });

      const article3 = await request
        .post(articlesRoutes.create)
        .set(commonHeaders)
        .send({
          title: 'A3',
          content: 'c',
          status: 'published',
          tags: ['python'],
        });

      const response = await request
        .get(`${articlesRoutes.getAll}?status=published&tag=js`)
        .set(commonHeaders);

      expect(response.status).toBe(StatusCodes.OK);
      const ids = response.body.map((a) => a.id);
      expect(ids).toContain(article1.body.id);
      expect(ids).not.toContain(article2.body.id);
      expect(ids).not.toContain(article3.body.id);

      await request
        .delete(articlesRoutes.delete(article1.body.id))
        .set(commonHeaders);
      await request
        .delete(articlesRoutes.delete(article2.body.id))
        .set(commonHeaders);
      await request
        .delete(articlesRoutes.delete(article3.body.id))
        .set(commonHeaders);
    });
  });

  describe('Comment - cascade on article delete', () => {
    it('should delete multiple comments when article is deleted', async () => {
      const articleRes = await request
        .post(articlesRoutes.create)
        .set(commonHeaders)
        .send({ title: 'Cascade Test', content: 'content' });

      const articleId = articleRes.body.id;

      const comment1 = await request
        .post(commentsRoutes.create)
        .set(commonHeaders)
        .send({ content: 'Comment 1', articleId, authorId: null });

      const comment2 = await request
        .post(commentsRoutes.create)
        .set(commonHeaders)
        .send({ content: 'Comment 2', articleId, authorId: null });

      await request.delete(articlesRoutes.delete(articleId)).set(commonHeaders);

      const search1 = await request
        .get(commentsRoutes.getById(comment1.body.id))
        .set(commonHeaders);
      const search2 = await request
        .get(commentsRoutes.getById(comment2.body.id))
        .set(commonHeaders);

      expect(search1.status).toBe(StatusCodes.NOT_FOUND);
      expect(search2.status).toBe(StatusCodes.NOT_FOUND);
    });
  });

  describe('Category - update preserves id', () => {
    it('should keep the same id after update', async () => {
      const createRes = await request
        .post(categoriesRoutes.create)
        .set(commonHeaders)
        .send({ name: 'Original', description: 'Desc' });

      const categoryId = createRes.body.id;

      const updateRes = await request
        .put(categoriesRoutes.update(categoryId))
        .set(commonHeaders)
        .send({ name: 'Updated', description: 'New desc' });

      expect(updateRes.status).toBe(StatusCodes.OK);
      expect(updateRes.body.id).toBe(categoryId);
      expect(updateRes.body.name).toBe('Updated');

      await request
        .delete(categoriesRoutes.delete(categoryId))
        .set(commonHeaders);
    });
  });
});
