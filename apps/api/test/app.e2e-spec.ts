import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { setupApiDocs } from './../src/api-docs';
import { PrismaService } from './../src/prisma/prisma.service';

interface OpenApiDocument {
  openapi: string;
  info: { title: string };
  paths: Record<
    string,
    Record<string, { requestBody?: { content: Record<string, unknown> } }>
  >;
}

// Smoke tests only: nothing here reaches the database, so Prisma is stubbed.
describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.JWT_SECRET ??= 'e2e-test-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    // Mirrors main.ts
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    setupApiDocs(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/docs-json serves an OpenAPI 3 document', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);
    const doc = res.body as OpenApiDocument;

    expect(doc.openapi).toMatch(/^3\./);
    expect(doc.info.title).toBe('Money Flow API');
    expect(doc.paths['/api/accounts']).toHaveProperty('get');
    expect(doc.paths['/api/accounts']).toHaveProperty('post');
  });

  it('documents DTO request bodies via the CLI plugin', async () => {
    const res = await request(app.getHttpServer()).get('/api/docs-json');
    const doc = res.body as OpenApiDocument & {
      components: { schemas: Record<string, { properties?: object }> };
    };

    expect(
      doc.paths['/api/accounts'].post.requestBody?.content['application/json'],
    ).toEqual({ schema: { $ref: '#/components/schemas/CreateAccountDto' } });
    expect(doc.components.schemas.CreateAccountDto.properties).toHaveProperty(
      'name',
    );
  });

  it('GET /api/docs serves the Scalar viewer', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/docs')
      .expect(200)
      .expect('Content-Type', /html/);
    expect(res.text).toContain('/api/docs-json');
  });

  it('GET /api/accounts without a token returns 401', () => {
    return request(app.getHttpServer()).get('/api/accounts').expect(401);
  });
});
