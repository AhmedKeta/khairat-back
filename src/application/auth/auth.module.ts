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
import { PasswordResetCodeEntity } from '../../infrastructure/database/entities/password-reset-code.entity';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { PasswordResetCodeRepository } from '../../infrastructure/repositories/password-reset-code.repository';
import { UserRepositoryPort } from '../../domain/user/ports/user.repository.port';
import { TrackingModule } from '../tracking/tracking.module';
import { MailModule } from '../../infrastructure/mail/mail.module';

@Module({
  imports: [
    TrackingModule,
    MailModule,
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
    TypeOrmModule.forFeature([UserEntity, PasswordResetCodeEntity]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    PasswordResetCodeRepository,
    { provide: UserRepositoryPort, useClass: UserRepository },
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
