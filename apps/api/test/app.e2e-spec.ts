import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Smoke test: boots the full app with the same global config as main.ts and
// checks routing, auth, and validation — none of which write to the database.
describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects protected routes without a token', () => {
    return request(app.getHttpServer()).get('/api/accounts').expect(401);
  });

  it('validates the register payload', () => {
    return request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'not-an-email', name: 'A', password: 'short' })
      .expect(400);
  });

  it('serves routes only under the /api prefix', () => {
    return request(app.getHttpServer()).get('/accounts').expect(404);
  });
});
