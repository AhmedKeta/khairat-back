import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { PasswordResetCodeEntity } from '../database/entities/password-reset-code.entity';

@Injectable()
export class PasswordResetCodeRepository {
  constructor(
    @InjectRepository(PasswordResetCodeEntity)
    private readonly repo: Repository<PasswordResetCodeEntity>,
  ) {}

  async replaceForEmail(
    email: string,
    codeHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.repo.delete({ email });
    await this.repo.save(
      this.repo.create({
        email,
        codeHash,
        expiresAt,
      }),
    );
  }

  async findValidByEmail(email: string): Promise<PasswordResetCodeEntity | null> {
    return this.repo.findOne({
      where: {
        email,
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteByEmail(email: string): Promise<void> {
    await this.repo.delete({ email });
  }
}
