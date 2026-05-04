import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UploadService } from '../../application/upload/upload.service';
import { DeleteUploadedFileDto } from '../../application/upload/dto/delete-uploaded-file.dto';
import { createImageUploadOptions, createVideoUploadOptions } from '../../application/upload/upload.config';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { UserRole } from '../../domain/user/value-objects/user-role.enum';

@ApiTags('upload')
@Controller({ path: 'upload', version: '1' })
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('images')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload one or more images (admin)' })
  @UseInterceptors(FilesInterceptor('files', 24, createImageUploadOptions()))
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files?.length) {
      throw new BadRequestException('No files uploaded');
    }
    const paths = this.uploadService.filesToStoredPaths(files, 'images');
    return { paths };
  }

  @Post('videos')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload one or more videos (admin)' })
  @UseInterceptors(FilesInterceptor('files', 12, createVideoUploadOptions()))
  async uploadVideos(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files?.length) {
      throw new BadRequestException('No files uploaded');
    }
    const paths = this.uploadService.filesToStoredPaths(files, 'videos');
    return { paths };
  }

  @Post('delete')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an uploaded file by its public URL (admin)' })
  async deleteUploaded(@Body() dto: DeleteUploadedFileDto) {
    this.uploadService.deleteByPublicUrl(dto.url);
    return { deleted: true };
  }
}
