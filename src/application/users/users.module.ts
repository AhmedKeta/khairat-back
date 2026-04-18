import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from '../../presentation/controllers/users.controller';
import { UsersService } from './users.service';
import { UserEntity } from '../../infrastructure/database/entities/user.entity';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { UserRepositoryPort } from '../../domain/user/ports/user.repository.port';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), AuthModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    { provide: UserRepositoryPort, useClass: UserRepository },
  ],
  exports: [UsersService],
})
export class UsersModule {}
