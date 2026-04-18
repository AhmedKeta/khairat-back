import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestimonialEntity } from '../../infrastructure/database/entities/testimonial.entity';

@Injectable()
export class TestimonialsService {
  constructor(
    @InjectRepository(TestimonialEntity)
    private readonly repo: Repository<TestimonialEntity>,
  ) {}

  async findAll() {
    return this.repo.find({
      where: { isVisible: true },
      order: { createdAt: 'DESC' },
    });
  }
}
