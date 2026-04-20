import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepositoryPort, UserFilters } from '../../domain/user/ports/user.repository.port';
import { UserRole } from '../../domain/user/value-objects/user-role.enum';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async findAll(filters: UserFilters) {
    return this.userRepository.findAll(filters);
  }

  async findById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    const { password, ...rest } = user as any;
    return rest;
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
    const { password, ...rest } = user as any;
    return rest;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');

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
    const { password, ...rest } = updated as any;
    return rest;
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
