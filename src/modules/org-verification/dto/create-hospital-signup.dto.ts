import { IsString, IsIn, IsUrl, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateHospitalSignupDto { 
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  slug: string;

  @IsIn(['hospital', 'campaign_organizer'])
  type: 'hospital' | 'campaign_organizer';

  @IsString()
  @MaxLength(500)
  address: string;

  @IsUrl()
  licenseDocUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  metadata?: string;
}
