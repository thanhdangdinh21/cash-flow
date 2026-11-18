import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Public on purpose: both routes reveal only up/down.
 *
 * - `GET /api/health/live`: the process is up. Never touches the database, so
 *   Render's every-few-seconds health checks and the keep-alive ping don't keep
 *   the free Neon database awake (it scales to zero after 5 idle minutes).
 * - `GET /api/health`: also pings the database. For humans and deploy checks.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get('live')
  @ApiOkResponse({ description: 'API process is up (database not checked)' })
  live() {
    return { status: 'ok' };
  }

  @Get()
  @ApiOkResponse({ description: 'API and database are up' })
  @ApiServiceUnavailableResponse({ description: 'Database is unreachable' })
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      this.logger.error('Database ping failed', error as Error);
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'down',
      });
    }
    return { status: 'ok', database: 'up' };
  }
}
