import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FaqController } from '../../presentation/controllers/faq.controller';
import { FaqService } from './faq.service';
import { FaqEntity } from '../../infrastructure/database/entities/faq.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FaqEntity])],
  controllers: [FaqController],
  providers: [FaqService],
})
export class FaqModule {}
