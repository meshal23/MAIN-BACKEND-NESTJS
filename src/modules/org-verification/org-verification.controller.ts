import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Session, Roles, OrgRoles } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { OrgVerificationService } from './org-verification.service';
import type { CreateHospitalSignupDto } from './dto/create-hospital-signup.dto';
import type { ReviewHospitalDto } from './dto/review-hospital.dto';

@Controller('organizations')
export class OrgVerificationController {
  constructor(
    private readonly orgVerificationService: OrgVerificationService,
  ) {}

  /**
   * POST /organizations/signup
   * Create a new organization signup with hospital profile
   * Authenticated users can sign up their organization
   */
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signupHospital(
    @Body() dto: CreateHospitalSignupDto,
    @Session() session: UserSession,
  ) {
    return this.orgVerificationService.signupHospital(dto, session);
  }

  /**
   * GET /organizations/pending
   * List all pending hospital organizations
   * Super admin only
   */
  @Get('pending')
  @Roles(['super_admin', 'hospital_admin'])
  async listPendingOrganizations() {
    return this.orgVerificationService.listPendingOrganizations();
  }

  /**
   * PATCH /organizations/:id/review
   * Approve or flag a hospital organization
   * Super admin only
   */
  @Patch(':id/review')
  @Roles(['super_admin'])
  async reviewHospital(
    @Param('id') organizationId: string,
    @Body() dto: ReviewHospitalDto,
  ) {
    return this.orgVerificationService.reviewHospital(organizationId, dto);
  }

  /**
   * GET /organizations/:id/status
   * Get organization verification status
   * Only accessible to members of that organization
   */
  @Get(':id/status')
  // @OrgRoles([
  //   'owner',
  //   'admin',
  //   'super_admin',
  //   'hospital_admin',
  //   'member',
  //   'campaign_organizer',
  // ])                          this will ask organization active session to put on the seesion later use
  async getOrganizationStatus(
    @Param('id') organizationId: string,
    @Session() session: UserSession,
  ) {
    if (!session?.user?.id) {
      throw new BadRequestException('User session required');
    }
    return this.orgVerificationService.getOrganizationStatus(
      organizationId,
      session.user.id,
    );
  }
}
