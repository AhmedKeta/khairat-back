import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestimonialsController } from '../../presentation/controllers/testimonials.controller';
import { TestimonialsService } from './testimonials.service';
import { TestimonialEntity } from '../../infrastructure/database/entities/testimonial.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TestimonialEntity])],
  controllers: [TestimonialsController],
  providers: [TestimonialsService],
})
export class TestimonialsModule {}
