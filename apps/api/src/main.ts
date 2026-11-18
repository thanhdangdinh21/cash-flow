import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app-setup';
import { setupApiDocs, shouldServeApiDocs } from './api-docs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  configureApp(app);
  if (shouldServeApiDocs()) setupApiDocs(app);
  // Hosts send SIGTERM before replacing an instance; let Nest close the DB pool.
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
