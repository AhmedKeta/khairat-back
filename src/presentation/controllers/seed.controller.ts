import { Controller, Headers, Post } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SeedService } from '../../application/seed/seed.service';

@ApiTags('seed')
@Controller({ path: 'seed', version: '1' })
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post('run')
  @ApiHeader({
    name: 'X-Seed-Secret',
    required: false,
    description:
      'Required in production when ENABLE_DATABASE_SEED=true (must match SEED_HTTP_SECRET).',
  })
  @ApiOperation({
    summary: 'Run database seed (countries + dashboard admin user)',
    description:
      'Requires ENABLE_DATABASE_SEED=true. In production, also requires SEED_HTTP_SECRET and matching X-Seed-Secret header. ' +
      'Idempotent: safe to run multiple times. Creates or updates the admin user from ADMIN_SEED_* environment variables.',
  })
  async run(@Headers('x-seed-secret') seedSecret?: string) {
    return this.seedService.run(seedSecret);
  }
}
