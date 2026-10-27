import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

// Absolute paths: neither SwaggerModule.setup nor app.use applies the global prefix.
export const API_DOCS_PATH = '/api/docs';
export const API_DOCS_JSON_PATH = `${API_DOCS_PATH}-json`;

export function shouldServeApiDocs(env: NodeJS.ProcessEnv = process.env) {
  return env.NODE_ENV !== 'production' || env.API_DOCS === 'true';
}

/** Serves the OpenAPI spec at /api/docs-json and the Scalar viewer at /api/docs. */
export function setupApiDocs(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Money Flow API')
    .setDescription(
      'Personal finance API. Get a token from POST /api/auth/login and use it as a Bearer token.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(API_DOCS_PATH, app, document, {
    ui: false,
    raw: ['json'],
  });
  app.use(
    API_DOCS_PATH,
    apiReference({
      url: API_DOCS_JSON_PATH,
      // Pre-select the bearer scheme and keep the pasted token across reloads
      authentication: { preferredSecurityScheme: 'bearer' },
      persistAuth: true,
    }),
  );
}
