import { Module } from '@nestjs/common';
import { UploadController } from '../../presentation/controllers/upload.controller';
import { UploadService } from './upload.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
