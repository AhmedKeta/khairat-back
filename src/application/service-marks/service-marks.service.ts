import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ServiceMarkEntity } from '../../infrastructure/database/entities/service-mark.entity';
import { ServiceMarkAssignmentEntity } from '../../infrastructure/database/entities/service-mark-assignment.entity';
import { CreateServiceMarkDto } from './dto/create-service-mark.dto';
import { UpdateServiceMarkDto } from './dto/update-service-mark.dto';

@Injectable()
export class ServiceMarksService {
  constructor(
    @InjectRepository(ServiceMarkEntity)
    private readonly markRepo: Repository<ServiceMarkEntity>,
    @InjectRepository(ServiceMarkAssignmentEntity)
    private readonly assignmentRepo: Repository<ServiceMarkAssignmentEntity>,
  ) {}

  async findAll() {
    return this.markRepo.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findAllAdmin() {
    return this.markRepo.find({
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findById(id: string) {
    const mark = await this.markRepo.findOne({ where: { id } });
    if (!mark) throw new NotFoundException('Service mark not found');
    return mark;
  }

  async findByIdOrNull(id: string): Promise<ServiceMarkEntity | null> {
    return this.markRepo.findOne({ where: { id } });
  }

  async findByIds(ids: string[]): Promise<ServiceMarkEntity[]> {
    if (ids.length === 0) return [];
    return this.markRepo.find({ where: { id: In(ids) } });
  }

  async create(dto: CreateServiceMarkDto) {
    const existing = await this.markRepo.findOne({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Mark with slug "${dto.slug}" already exists`);
    }

    let displayOrder = dto.displayOrder;
    if (displayOrder === undefined) {
      displayOrder = await this.getNextDisplayOrder();
    }

    const mark = this.markRepo.create({
      name: dto.name,
      slug: dto.slug,
      backgroundColor: dto.backgroundColor,
      textColor: dto.textColor,
      displayOrder,
      isActive: dto.isActive ?? true,
    });
    return this.markRepo.save(mark);
  }

  async update(id: string, dto: UpdateServiceMarkDto) {
    const mark = await this.findById(id);

    if (dto.slug && dto.slug !== mark.slug) {
      const existing = await this.markRepo.findOne({
        where: { slug: dto.slug },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Mark with slug "${dto.slug}" already exists`);
      }
    }

    await this.markRepo.update(id, dto);
    return this.findById(id);
  }

  async delete(id: string) {
    await this.findById(id);
    const assignmentCount = await this.assignmentRepo.count({
      where: { markId: id },
    });
    if (assignmentCount > 0) {
      throw new ConflictException(
        `Cannot delete mark: ${assignmentCount} service(s) still use it`,
      );
    }
    await this.markRepo.delete(id);
  }

  async toggleActive(id: string) {
    const mark = await this.findById(id);
    return this.update(id, { isActive: !mark.isActive });
  }

  async reorder(orderedIds: string[]) {
    const count = await this.markRepo.count({
      where: { id: In(orderedIds) },
    });
    if (count !== orderedIds.length) {
      throw new BadRequestException('One or more marks do not exist');
    }

    await this.markRepo.manager.transaction(async (em) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await em.update(
          ServiceMarkEntity,
          { id: orderedIds[i] },
          { displayOrder: i },
        );
      }
    });
  }

  async syncServiceMarks(serviceId: string, markIds: string[]) {
    const uniqueIds = [...new Set(markIds)];

    if (uniqueIds.length > 0) {
      const marks = await this.findByIds(uniqueIds);
      if (marks.length !== uniqueIds.length) {
        throw new BadRequestException('One or more service marks do not exist');
      }
    }

    await this.assignmentRepo.manager.transaction(async (em) => {
      await em.delete(ServiceMarkAssignmentEntity, { serviceId });

      for (let i = 0; i < uniqueIds.length; i++) {
        const assignment = em.create(ServiceMarkAssignmentEntity, {
          serviceId,
          markId: uniqueIds[i],
          displayOrder: i,
        });
        await em.save(assignment);
      }
    });
  }

  private async getNextDisplayOrder(): Promise<number> {
    const row = await this.markRepo
      .createQueryBuilder('m')
      .select('MAX(m.displayOrder)', 'max')
      .getRawOne<{ max: string | null }>();
    const max = row?.max != null ? Number(row.max) : NaN;
    return Number.isFinite(max) ? max + 1 : 0;
  }
}
