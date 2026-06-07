import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { UserRepositoryPort } from '../../domain/user/ports/user.repository.port';
import { UserRole } from '../../domain/user/value-objects/user-role.enum';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { User } from '../../domain/user/entities/user.entity';
import { TrackingService } from '../tracking/tracking.service';
import { sanitizeUser } from '../../shared/utils/sanitize-response.util';
import { PasswordResetCodeRepository } from '../../infrastructure/repositories/password-reset-code.repository';
import { MailService } from '../../infrastructure/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly trackingService: TrackingService,
    private readonly passwordResetCodeRepository: PasswordResetCodeRepository,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    if (!dto.terms) {
      throw new BadRequestException('You must accept the terms');
    }

    const exists = await this.userRepository.existsByEmail(dto.email);
    if (exists) {
      throw new ConflictException('Email already registered');
    }

    const phoneTaken = await this.userRepository.existsByWhatsappNumber(
      dto.whatsappNumber,
    );
    if (phoneTaken) {
      throw new ConflictException('Phone number already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.userRepository.create({
      fullName: dto.fullName,
      email: dto.email,
      password: hashedPassword,
      whatsappNumber: dto.whatsappNumber,
      countryId: dto.countryId,
      role: UserRole.USER,
      isVerified: false,
      isBlocked: false,
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    await this.attachTrackingToUser(dto.guestId, dto.trackingVisitId, user.id);

    return {
      user: sanitizeUser(user as unknown as Record<string, unknown>),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const identifier = dto.identifier.trim();
    const normalizedPhone = this.normalizePhone(identifier);
    const normalizedEmail = identifier.toLowerCase();

    const user =
      (await this.userRepository.findByEmail(normalizedEmail)) ||
      (normalizedPhone
        ? await this.userRepository.findByWhatsappNumber(normalizedPhone)
        : null) ||
      (await this.userRepository.findByWhatsappNumber(identifier));
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('Account has been blocked');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    await this.attachTrackingToUser(dto.guestId, dto.trackingVisitId, user.id);

    return {
      user: sanitizeUser(user as unknown as Record<string, unknown>),
      ...tokens,
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    try {
      this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  async validateUser(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return null;

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return null;

    return user;
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(normalizedEmail);
    const isDashboard = dto.client === 'dashboard';

    if (isDashboard && user && user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Not authorized');
    }

    if (user && (!isDashboard || user.role === UserRole.ADMIN)) {
      const code = String(randomInt(100000, 1000000));
      const codeHash = await bcrypt.hash(code, 12);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await this.passwordResetCodeRepository.replaceForEmail(
        normalizedEmail,
        codeHash,
        expiresAt,
      );

      await this.mailService.sendPasswordResetCode(normalizedEmail, code);
    }

    return { message: 'If the email exists, a reset code has been sent.' };
  }

  async verifyResetCode(dto: VerifyResetCodeDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const isDashboard = dto.client === 'dashboard';
    const record =
      await this.passwordResetCodeRepository.findValidByEmail(normalizedEmail);

    if (!record) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    const codeValid = await bcrypt.compare(dto.code, record.codeHash);
    if (!codeValid) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    this.assertDashboardAdminReset(user, isDashboard);

    const purpose = isDashboard ? 'password-reset-admin' : 'password-reset';
    const resetToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, purpose },
      {
        secret: this.configService.get('JWT_SECRET', 'secret'),
        expiresIn: '15m',
      },
    );

    await this.passwordResetCodeRepository.deleteByEmail(normalizedEmail);

    return { resetToken };
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    let payload: { sub: string; email: string; purpose?: string };
    try {
      payload = this.jwtService.verify(dto.resetToken, {
        secret: this.configService.get('JWT_SECRET', 'secret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const allowedPurposes = ['password-reset', 'password-reset-admin'];
    if (!payload.purpose || !allowedPurposes.includes(payload.purpose)) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (payload.purpose === 'password-reset-admin') {
      this.assertDashboardAdminReset(user, true);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    await this.userRepository.update(payload.sub, { password: hashedPassword });

    return { message: 'Password reset successfully' };
  }

  private assertDashboardAdminReset(user: User, isDashboard: boolean): void {
    if (isDashboard && user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Not authorized');
    }
  }

  private async generateTokens(userId: string, email: string, role: UserRole) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET', 'refresh-secret'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private normalizePhone(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const hasPlus = trimmed.startsWith('+');
    const digitsOnly = trimmed.replace(/[^\d]/g, '');
    if (!digitsOnly) return null;

    return hasPlus ? `+${digitsOnly}` : digitsOnly;
  }

  private async attachTrackingToUser(
    guestId: string | undefined,
    trackingVisitId: string | undefined,
    userId: string,
  ): Promise<void> {
    try {
      if (guestId?.trim()) {
        await this.trackingService.linkGuestToUser(guestId, userId);
      }
      if (trackingVisitId?.trim()) {
        await this.trackingService.linkVisitToUser(trackingVisitId.trim(), userId);
      }
    } catch {
      // Never block auth on tracking persistence issues
    }
  }
}
