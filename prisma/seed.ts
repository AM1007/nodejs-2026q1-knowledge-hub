import { PrismaClient, UserRole, ArticleStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.comment.deleteMany();
  await prisma.article.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const salt = parseInt(process.env.CRYPT_SALT) || 10;

  const admin = await prisma.user.create({
    data: {
      login: 'admin',
      password: await bcrypt.hash('admin123', salt),
      role: UserRole.ADMIN,
    },
  });

  const editor = await prisma.user.create({
    data: {
      login: 'editor',
      password: await bcrypt.hash('editor123', salt),
      role: UserRole.EDITOR,
    },
  });

  const techCategory = await prisma.category.create({
    data: { name: 'Technology', description: 'Tech articles' },
  });

  const scienceCategory = await prisma.category.create({
    data: { name: 'Science', description: 'Science articles' },
  });

  const designCategory = await prisma.category.create({
    data: { name: 'Design', description: 'Design articles' },
  });

  const tags = await Promise.all(
    ['nodejs', 'typescript', 'docker', 'prisma', 'nestjs'].map((name) =>
      prisma.tag.create({ data: { name } }),
    ),
  );

  await prisma.article.create({
    data: {
      title: 'Getting Started with NestJS',
      content: 'NestJS is a progressive Node.js framework.',
      status: ArticleStatus.PUBLISHED,
      authorId: admin.id,
      categoryId: techCategory.id,
      tags: { connect: [{ id: tags[0].id }, { id: tags[4].id }] },
    },
  });

  await prisma.article.create({
    data: {
      title: 'TypeScript Best Practices',
      content: 'TypeScript adds static typing to JavaScript.',
      status: ArticleStatus.PUBLISHED,
      authorId: editor.id,
      categoryId: techCategory.id,
      tags: { connect: [{ id: tags[1].id }] },
    },
  });

  await prisma.article.create({
    data: {
      title: 'Docker for Beginners',
      content: 'Docker simplifies application deployment.',
      status: ArticleStatus.DRAFT,
      authorId: admin.id,
      categoryId: techCategory.id,
      tags: { connect: [{ id: tags[2].id }] },
    },
  });

  await prisma.article.create({
    data: {
      title: 'Prisma ORM Guide',
      content: 'Prisma is a next-generation ORM.',
      status: ArticleStatus.DRAFT,
      authorId: editor.id,
      categoryId: scienceCategory.id,
      tags: { connect: [{ id: tags[3].id }, { id: tags[1].id }] },
    },
  });

  const articleForComments = await prisma.article.create({
    data: {
      title: 'Design Patterns',
      content: 'Design patterns are reusable solutions.',
      status: ArticleStatus.ARCHIVED,
      authorId: admin.id,
      categoryId: designCategory.id,
      tags: { connect: [{ id: tags[0].id }, { id: tags[1].id }] },
    },
  });

  await prisma.comment.createMany({
    data: [
      {
        content: 'Great article!',
        articleId: articleForComments.id,
        authorId: admin.id,
      },
      {
        content: 'Very helpful.',
        articleId: articleForComments.id,
        authorId: editor.id,
      },
      {
        content: 'Thanks for sharing.',
        articleId: articleForComments.id,
        authorId: null,
      },
    ],
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
