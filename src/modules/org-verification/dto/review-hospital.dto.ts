import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewHospitalDto {
  @IsIn(['approved', 'flagged'])
  decision: 'approved' | 'flagged';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
