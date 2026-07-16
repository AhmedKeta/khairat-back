import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, Equal } from 'typeorm';
import { UserEntity } from '../database/entities/user.entity';
import { UserRepositoryPort, UserFilters } from '../../domain/user/ports/user.repository.port';
import { User } from '../../domain/user/entities/user.entity';
import { PaginatedResult } from '../../shared/dto/pagination.dto';
import { resolveSortColumn } from '../../shared/utils/sort-column.util';

const USER_SORT_COLUMNS = [
  'createdAt',
  'updatedAt',
  'fullName',
  'email',
  'role',
] as const;

@Injectable()
export class UserRepository implements UserRepositoryPort {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async findAll(filters: UserFilters): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'DESC', country, role, isBlocked } = filters;

    const query = this.repo.createQueryBuilder('user');

    if (search) {
      query.andWhere(
        '(user.fullName ILIKE :search OR user.email ILIKE :search OR user.whatsappNumber ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (country) query.andWhere('user.countryId = :country', { country });
    if (role) query.andWhere('user.role = :role', { role });
    if (isBlocked !== undefined) query.andWhere('user.isBlocked = :isBlocked', { isBlocked });

    const safeSortBy = resolveSortColumn(sortBy, USER_SORT_COLUMNS, 'createdAt');
    query.orderBy(`user.${safeSortBy}`, sortOrder as 'ASC' | 'DESC');
    query.skip((page - 1) * limit).take(limit);

    const [entities, total] = await query.getManyAndCount();

    return {
      data: entities.map(this.toDomain),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repo.findOne({ where: { email } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByWhatsappNumber(whatsappNumber: string): Promise<User | null> {
    const entity = await this.repo.findOne({ where: { whatsappNumber } });
    return entity ? this.toDomain(entity) : null;
  }

  async create(user: Partial<User>): Promise<User> {
    const entity = this.repo.create(user as Partial<UserEntity>);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async update(id: string, user: Partial<User>): Promise<User> {
    await this.repo.update(id, user as Partial<UserEntity>);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async existsByEmail(email: string, excludeUserId?: string): Promise<boolean> {
    const where = excludeUserId
      ? { email, id: Not(Equal(excludeUserId)) }
      : { email };
    const count = await this.repo.count({ where });
    return count > 0;
  }

  async existsByWhatsappNumber(
    whatsappNumber: string,
    excludeUserId?: string,
  ): Promise<boolean> {
    const where = excludeUserId
      ? { whatsappNumber, id: Not(Equal(excludeUserId)) }
      : { whatsappNumber };
    const count = await this.repo.count({ where });
    return count > 0;
  }

  private toDomain(entity: UserEntity): User {
    return new User({
      id: entity.id,
      fullName: entity.fullName,
      email: entity.email,
      password: entity.password,
      whatsappNumber: entity.whatsappNumber,
      countryId: entity.countryId,
      role: entity.role,
      isVerified: entity.isVerified,
      isBlocked: entity.isBlocked,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
