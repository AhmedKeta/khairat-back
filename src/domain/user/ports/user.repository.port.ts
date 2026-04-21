import { User } from '../entities/user.entity';
import { PaginatedResult, PaginationDto } from '../../../shared/dto/pagination.dto';

export interface UserFilters extends PaginationDto {
  country?: string;
  role?: string;
  isBlocked?: boolean;
}

export abstract class UserRepositoryPort {
  abstract findAll(filters: UserFilters): Promise<PaginatedResult<User>>;
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findByWhatsappNumber(whatsappNumber: string): Promise<User | null>;
  abstract create(user: Partial<User>): Promise<User>;
  abstract update(id: string, user: Partial<User>): Promise<User>;
  abstract delete(id: string): Promise<void>;
  abstract existsByEmail(email: string): Promise<boolean>;
  /** When `excludeUserId` is set, ignores that user (for updates). */
  abstract existsByWhatsappNumber(
    whatsappNumber: string,
    excludeUserId?: string,
  ): Promise<boolean>;
}
