import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepositoryPort, UserFilters } from '../../domain/user/ports/user.repository.port';
import { UpdateUserDto } from './dto/update-user.dto';

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

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');

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
    return this.userRepository.update(id, { isBlocked: user.isBlocked });
  }

  async unblockUser(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    user.unblock();
    return this.userRepository.update(id, { isBlocked: user.isBlocked });
  }
}
