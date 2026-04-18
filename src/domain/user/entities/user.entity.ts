import { UserRole } from '../value-objects/user-role.enum';

export class User {
  id: string;
  fullName: string;
  email: string;
  password: string;
  whatsappNumber: string;
  countryId: string;
  role: UserRole;
  isVerified: boolean;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  block(): void {
    this.isBlocked = true;
  }

  unblock(): void {
    this.isBlocked = false;
  }

  verify(): void {
    this.isVerified = true;
  }
}
