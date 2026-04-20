import { Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SeedService } from '../../application/seed/seed.service';

@ApiTags('seed')
@Controller({ path: 'seed', version: '1' })
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post('run')
  @ApiOperation({
    summary: 'Run database seed (countries + dashboard admin user)',
    description:
      'Requires ENABLE_DATABASE_SEED=true. Idempotent: safe to run multiple times. ' +
      'Creates or updates the admin user from ADMIN_SEED_* environment variables.',
  })
  async run() {
    return this.seedService.run();
  }
}
