import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/app-setup';
import { PrismaService } from './../src/prisma/prisma.service';

// Nothing here reaches a real database: Prisma is stubbed so the health
// check's DB ping can be made to succeed or fail on demand.
describe('CORS and health check (e2e)', () => {
  let app: INestApplication<App>;
  const queryRaw = jest.fn();

  beforeAll(async () => {
    process.env.JWT_SECRET ??= 'e2e-test-secret';

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: queryRaw })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app, {
      CORS_ORIGINS: 'https://web.example.com, https://other.example.com',
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => queryRaw.mockReset());

  describe('CORS_ORIGINS', () => {
    it('allows a listed origin', async () => {
      queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      await request(app.getHttpServer())
        .get('/api/health')
        .set('Origin', 'https://other.example.com')
        .expect('Access-Control-Allow-Origin', 'https://other.example.com');
    });

    it('answers a preflight for a listed origin', async () => {
      await request(app.getHttpServer())
        .options('/api/auth/login')
        .set('Origin', 'https://web.example.com')
        .set('Access-Control-Request-Method', 'POST')
        .expect(204)
        .expect('Access-Control-Allow-Origin', 'https://web.example.com');
    });

    it('sends no allow-origin header for an unlisted origin', async () => {
      queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      const res = await request(app.getHttpServer())
        .get('/api/health')
        .set('Origin', 'https://evil.example.com');
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('no longer allows localhost:3000 once CORS_ORIGINS is set', async () => {
      queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      const res = await request(app.getHttpServer())
        .get('/api/health')
        .set('Origin', 'http://localhost:3000');
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('GET /api/health', () => {
    it('returns 200 when the database answers', async () => {
      queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      const res = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);
      expect(res.body).toEqual({ status: 'ok', database: 'up' });
      expect(queryRaw).toHaveBeenCalledTimes(1);
    });

    it('returns 503 when the database is unreachable', async () => {
      queryRaw.mockRejectedValue(new Error('connect ECONNREFUSED'));
      const res = await request(app.getHttpServer())
        .get('/api/health')
        .expect(503);
      expect(res.body).toMatchObject({ status: 'error', database: 'down' });
      // Don't leak driver error details to the public endpoint.
      expect(JSON.stringify(res.body)).not.toContain('ECONNREFUSED');
    });

    it('GET /api/health/live returns 200 without touching the database', async () => {
      queryRaw.mockRejectedValue(new Error('database is asleep'));
      const res = await request(app.getHttpServer())
        .get('/api/health/live')
        .expect(200);
      expect(res.body).toEqual({ status: 'ok' });
      expect(queryRaw).not.toHaveBeenCalled();
    });

    it('needs no auth token', async () => {
      queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      await request(app.getHttpServer()).get('/api/health').expect(200);
    });
  });
});
