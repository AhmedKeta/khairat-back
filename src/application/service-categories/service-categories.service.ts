import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ServiceCategoryEntity } from '../../infrastructure/database/entities/service-category.entity';
import { ServiceEntity } from '../../infrastructure/database/entities/service.entity';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';

@Injectable()
export class ServiceCategoriesService {
  constructor(
    @InjectRepository(ServiceCategoryEntity)
    private readonly categoryRepo: Repository<ServiceCategoryEntity>,
    @InjectRepository(ServiceEntity)
    private readonly serviceRepo: Repository<ServiceEntity>,
  ) {}

  async findAll() {
    return this.categoryRepo.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findAllAdmin() {
    return this.categoryRepo.find({
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findById(id: string) {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Service category not found');
    return category;
  }

  async findByIdOrNull(id: string): Promise<ServiceCategoryEntity | null> {
    return this.categoryRepo.findOne({ where: { id } });
  }

  async create(dto: CreateServiceCategoryDto) {
    const existing = await this.categoryRepo.findOne({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Category with slug "${dto.slug}" already exists`);
    }

    let displayOrder = dto.displayOrder;
    if (displayOrder === undefined) {
      displayOrder = await this.getNextDisplayOrder();
    }

    const category = this.categoryRepo.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description ?? null,
      displayOrder,
      isActive: dto.isActive ?? true,
    });
    return this.categoryRepo.save(category);
  }

  async update(id: string, dto: UpdateServiceCategoryDto) {
    const category = await this.findById(id);

    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.categoryRepo.findOne({
        where: { slug: dto.slug },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Category with slug "${dto.slug}" already exists`);
      }
    }

    await this.categoryRepo.update(id, dto);
    return this.findById(id);
  }

  async delete(id: string) {
    await this.findById(id);
    const serviceCount = await this.serviceRepo.count({
      where: { categoryId: id },
    });
    if (serviceCount > 0) {
      throw new ConflictException(
        `Cannot delete category: ${serviceCount} service(s) still reference it`,
      );
    }
    await this.categoryRepo.delete(id);
  }

  async toggleActive(id: string) {
    const category = await this.findById(id);
    return this.update(id, { isActive: !category.isActive });
  }

  async reorder(orderedIds: string[]) {
    const count = await this.categoryRepo.count({
      where: { id: In(orderedIds) },
    });
    if (count !== orderedIds.length) {
      throw new BadRequestException('One or more categories do not exist');
    }

    await this.categoryRepo.manager.transaction(async (em) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await em.update(
          ServiceCategoryEntity,
          { id: orderedIds[i] },
          { displayOrder: i },
        );
      }
    });
  }

  private async getNextDisplayOrder(): Promise<number> {
    const row = await this.categoryRepo
      .createQueryBuilder('c')
      .select('MAX(c.displayOrder)', 'max')
      .getRawOne<{ max: string | null }>();
    const max = row?.max != null ? Number(row.max) : NaN;
    return Number.isFinite(max) ? max + 1 : 0;
  }
}
