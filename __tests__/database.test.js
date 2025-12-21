import { PrismaClient } from '@prisma/client';

describe('Database Connection', () => {
  let prisma;

  beforeAll(() => {
    // In CI from "Run Tests" env
    // Locally: from .env file
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should connect to database', async () => {
    await expect(prisma.$connect()).resolves.not.toThrow();
  });

  test('should query users table', async () => {
    // Verify we can query the users table (tests schema is correct)
    const users = await prisma.user.findMany({ take: 1 });
    expect(Array.isArray(users)).toBe(true);
  });
});

