import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TestimonialEntity } from "../../infrastructure/database/entities/testimonial.entity";
import { CreateTestimonialDto } from "./dto/create-testimonial.dto";
import { UpdateTestimonialDto } from "./dto/update-testimonial.dto";

@Injectable()
export class TestimonialsService {
  constructor(
    @InjectRepository(TestimonialEntity)
    private readonly repo: Repository<TestimonialEntity>,
  ) {}

  async findAllVisible() {
    return this.repo.find({
      where: { isVisible: true },
      order: { createdAt: "DESC" },
    });
  }

  async findAllAdmin() {
    return this.repo.find({ order: { createdAt: "DESC" } });
  }

  async findById(id: string) {
    const testimonial = await this.repo.findOne({ where: { id } });
    if (!testimonial) throw new NotFoundException("Testimonial not found");
    return testimonial;
  }

  async create(dto: CreateTestimonialDto) {
    const testimonial = this.repo.create({
      userName: dto.userName,
      avatar: dto.avatar ?? null,
      content: dto.content,
      contentAr: dto.contentAr ?? null,
      rating: dto.rating ?? 5,
      isVisible: dto.isVisible ?? true,
    });
    return this.repo.save(testimonial);
  }

  async update(id: string, dto: UpdateTestimonialDto) {
    await this.findById(id);
    await this.repo.update(id, dto);
    return this.findById(id);
  }

  async delete(id: string) {
    await this.findById(id);
    await this.repo.delete(id);
  }

  async toggleVisibility(id: string) {
    const testimonial = await this.findById(id);
    return this.update(id, { isVisible: !testimonial.isVisible });
  }
}
