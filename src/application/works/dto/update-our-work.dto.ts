import { PartialType } from '@nestjs/swagger';
import { CreateOurWorkDto } from './create-our-work.dto';

export class UpdateOurWorkDto extends PartialType(CreateOurWorkDto) {}
