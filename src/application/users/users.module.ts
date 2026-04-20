import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from '../../presentation/controllers/users.controller';
import { UsersService } from './users.service';
import { UserEntity } from '../../infrastructure/database/entities/user.entity';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { UserRepositoryPort } from '../../domain/user/ports/user.repository.port';
import { AuthModule } from '../auth/auth.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), AuthModule, AuditLogsModule, TrackingModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    { provide: UserRepositoryPort, useClass: UserRepository },
  ],
  exports: [UsersService],
})
export class UsersModule {}
