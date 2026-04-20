import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from '../../presentation/controllers/auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { UserEntity } from '../../infrastructure/database/entities/user.entity';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { UserRepositoryPort } from '../../domain/user/ports/user.repository.port';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [
    TrackingModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'secret'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '15m'),
        },
      }),
    }),
    TypeOrmModule.forFeature([UserEntity]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    { provide: UserRepositoryPort, useClass: UserRepository },
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
