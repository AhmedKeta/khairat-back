import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepositoryPort, UserFilters } from '../../domain/user/ports/user.repository.port';
import { UserRole } from '../../domain/user/value-objects/user-role.enum';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '../../domain/user/entities/user.entity';
import { sanitizeUser } from '../../shared/utils/sanitize-response.util';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async findAll(filters: UserFilters) {
    const result = await this.userRepository.findAll(filters);
    return {
      ...result,
      data: result.data.map((u) => sanitizeUser(u as unknown as Record<string, unknown>)),
    };
  }

  async findById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return sanitizeUser(user as unknown as Record<string, unknown>);
  }

  async create(dto: CreateUserDto) {
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
      role: dto.role ?? UserRole.USER,
      isVerified: false,
      isBlocked: false,
    });
    return sanitizeUser(user as unknown as Record<string, unknown>);
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');

    if (dto.email !== undefined && dto.email !== user.email) {
      const emailTaken = await this.userRepository.existsByEmail(dto.email, id);
      if (emailTaken) {
        throw new ConflictException('Email already registered');
      }
    }

    if (dto.whatsappNumber !== undefined) {
      const taken = await this.userRepository.existsByWhatsappNumber(
        dto.whatsappNumber,
        id,
      );
      if (taken) {
        throw new ConflictException('Phone number already registered');
      }
    }

    const updated = await this.userRepository.update(id, dto);
    return sanitizeUser(updated as unknown as Record<string, unknown>);
  }

  async updateSelf(id: string, dto: UpdateMeDto) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const curPw = dto.currentPassword?.trim() ?? '';
    const newPw = dto.newPassword?.trim() ?? '';

    if (curPw || newPw) {
      if (!curPw || !newPw) {
        throw new BadRequestException(
          'Both current password and new password are required to change password',
        );
      }
      const passwordOk = await bcrypt.compare(curPw, user.password);
      if (!passwordOk) {
        throw new UnauthorizedException('Current password is incorrect');
      }
    }

    if (dto.email !== undefined && dto.email !== user.email) {
      const emailTaken = await this.userRepository.existsByEmail(dto.email, id);
      if (emailTaken) {
        throw new ConflictException('Email already registered');
      }
    }

    if (dto.whatsappNumber !== undefined) {
      const taken = await this.userRepository.existsByWhatsappNumber(
        dto.whatsappNumber,
        id,
      );
      if (taken) {
        throw new ConflictException('Phone number already registered');
      }
    }

    const patch: Partial<User> = {};
    if (dto.fullName !== undefined) patch.fullName = dto.fullName;
    if (dto.email !== undefined) patch.email = dto.email;
    if (dto.whatsappNumber !== undefined) patch.whatsappNumber = dto.whatsappNumber;
    if (dto.countryId !== undefined) patch.countryId = dto.countryId;
    if (curPw && newPw) {
      patch.password = await bcrypt.hash(newPw, 12);
    }

    if (Object.keys(patch).length === 0) {
      return this.findById(id);
    }

    const updated = await this.userRepository.update(id, patch);
    return sanitizeUser(updated as unknown as Record<string, unknown>);
  }

  async delete(id: string) {
    await this.findById(id);
    await this.userRepository.delete(id);
  }

  async blockUser(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    user.block();
    await this.userRepository.update(id, { isBlocked: user.isBlocked });
    return this.findById(id);
  }

  async unblockUser(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    user.unblock();
    await this.userRepository.update(id, { isBlocked: user.isBlocked });
    return this.findById(id);
  }
}
