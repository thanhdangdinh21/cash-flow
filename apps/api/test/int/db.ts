import { Test } from '@nestjs/testing';
import type { ModuleMetadata } from '@nestjs/common';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';

export async function makeTestModule(metadata: ModuleMetadata) {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      PrismaModule,
      ...(metadata.imports ?? []),
    ],
    providers: metadata.providers ?? [],
  }).compile();
  return moduleRef;
}

// Truncate every table except the migration ledger between tests.
export async function resetDb(prisma: PrismaService) {
  const rows = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const list = rows.map((r) => `"public"."${r.tablename}"`).join(', ');
  if (list)
    await prisma.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
}

// Minimal fixture: a user with a cash ASSET account, used by most tests.
export async function seedUser(prisma: PrismaService, currency = 'USD') {
  const user = await prisma.user.create({
    data: { email: `u${Date.now()}@test.dev`, passwordHash: 'x', name: 'Test' },
  });
  const cash = await prisma.account.create({
    data: {
      ownerId: user.id,
      name: 'Cash',
      type: 'ASSET',
      currencyCode: currency,
    },
  });
  return { userId: user.id, cashId: cash.id };
}
