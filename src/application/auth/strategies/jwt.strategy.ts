import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepositoryPort } from '../../../domain/user/ports/user.repository.port';
import { sanitizeUser } from '../../../shared/utils/sanitize-response.util';
import { requireJwtSecret } from '../../../shared/utils/jwt-secrets.util';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly userRepository: UserRepositoryPort,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: requireJwtSecret(
        configService.get<string>('JWT_SECRET'),
        'JWT_SECRET',
      ),
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    role: string;
    type?: string;
    purpose?: string;
  }) {
    // Password-reset JWTs must never authenticate as session tokens.
    if (payload.purpose || payload.type !== 'access') {
      throw new UnauthorizedException();
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user || user.isBlocked) {
      throw new UnauthorizedException();
    }
    return sanitizeUser(user as unknown as Record<string, unknown>);
  }
}
