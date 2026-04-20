import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OurWorkEntity } from '../../infrastructure/database/entities/our-work.entity';
import { CreateOurWorkDto } from './dto/create-our-work.dto';
import { UpdateOurWorkDto } from './dto/update-our-work.dto';

@Injectable()
export class WorksService {
  constructor(
    @InjectRepository(OurWorkEntity)
    private readonly repo: Repository<OurWorkEntity>,
  ) {}

  async findAllVisible() {
    return this.repo.find({
      where: { isVisible: true },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findAllAdmin() {
    return this.repo.find({
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findById(id: string) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Work item not found');
    return row;
  }

  async create(dto: CreateOurWorkDto) {
    const row = this.repo.create({
      title: dto.title,
      titleAr: dto.titleAr ?? null,
      imageUrl: dto.imageUrl,
      sortOrder: dto.sortOrder ?? 0,
      isVisible: dto.isVisible ?? true,
    });
    return this.repo.save(row);
  }

  async update(id: string, dto: UpdateOurWorkDto) {
    await this.findById(id);
    await this.repo.update(id, dto);
    return this.findById(id);
  }

  async delete(id: string) {
    await this.findById(id);
    await this.repo.delete(id);
  }

  async toggleVisibility(id: string) {
    const row = await this.findById(id);
    return this.update(id, { isVisible: !row.isVisible });
  }
}
