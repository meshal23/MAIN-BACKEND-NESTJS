import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../lib/database/prisma.service';
import { CreateHospitalSignupDto } from './dto/create-hospital-signup.dto';
import { ReviewHospitalDto } from './dto/review-hospital.dto';
import { UserSession } from '@thallesp/nestjs-better-auth';

@Injectable()
export class OrgVerificationService {
  private readonly logger = new Logger(OrgVerificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new organization signup with hospital profile
   * Creates organization and hospital profile via Prisma
   * Note: User must already exist in auth.user table (via better-auth signup)
   */
  async signupHospital(dto: CreateHospitalSignupDto, session: UserSession) {
    if (!session?.user?.id) {
      throw new BadRequestException('User session required');
    }

    const userId = session.user.id;

    try {
      // Use a transaction to ensure both organization and hospital profile are created together
      const result = await this.prisma.$transaction(async (tx) => {
        // Step 1: Create organization in auth schema
        const organization = await tx.organization.create({
          data: {
            name: dto.name,
            slug: dto.slug,
            metadata: {
              type: dto.type,
              ...(dto.metadata ? JSON.parse(dto.metadata) : {}),
            },
          },
        });

        this.logger.debug(`Organization created: ${organization.id}`);

        // Step 2: Add user as member of the organization with hospital_admin role
        const member = await tx.member.create({
          data: {
            organizationId: organization.id,
            userId,
            role: 'hospital_admin',
          },
        });

        this.logger.debug(
          `User ${userId} added to organization ${organization.id} as hospital_admin`,
        );

        // Step 3: Create HospitalProfile in org_verification schema
        const hospitalProfile = await tx.hospitalProfile.create({
          data: {
            organizationId: organization.id,
            verificationStatus: 'pending',
            trustScore: 0,
            licenseDocUrl: dto.licenseDocUrl,
            address: dto.address,
          },
        });

        this.logger.debug(`HospitalProfile created: ${hospitalProfile.id}`);

        return {
          organization,
          hospitalProfile,
          member,
        };
      });

      return {
        organization: {
          id: result.organization.id,
          name: result.organization.name,
          slug: result.organization.slug,
          type: dto.type,
        },
        hospitalProfile: result.hospitalProfile,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      // Check for slug conflict (common case)
      if (
        message.includes('slug') ||
        message.includes('Unique constraint failed')
      ) {
        throw new ConflictException(
          `Organization slug "${dto.slug}" already exists. Please choose a different slug.`,
        );
      }

      this.logger.error(`Failed to create organization: ${message}`);
      throw new BadRequestException(`Organization signup failed: ${message}`);
    }
  }

  /**
   * List all pending hospital organizations
   * Super admin only
   */
  async listPendingOrganizations() {
    try {
      const pendingProfiles = await this.prisma.hospitalProfile.findMany({
        where: {
          verificationStatus: 'pending',
        },
      });

      // Fetch organization details for each profile
      const withOrgDetails = await Promise.all(
        pendingProfiles.map(async (profile) => {
          const org = await this.prisma.organization.findUnique({
            where: { id: profile.organizationId },
            select: {
              id: true,
              name: true,
              slug: true,
              createdAt: true,
            },
          });

          return {
            ...profile,
            organization: org,
          };
        }),
      );

      return withOrgDetails;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to list pending organizations: ${message}`);
      throw new BadRequestException(
        `Failed to list pending organizations: ${message}`,
      );
    }
  }

  /**
   * Review (approve or flag) a hospital organization
   * Super admin only
   * Idempotent-safe
   */
  async reviewHospital(organizationId: string, dto: ReviewHospitalDto) {
    try {
      const hospitalProfile = await this.prisma.hospitalProfile.findUnique({
        where: { organizationId },
      });

      if (!hospitalProfile) {
        throw new NotFoundException(
          `Hospital profile not found for organization ${organizationId}`,
        );
      }

      // Check idempotency: if already in the same status, return early with error
      if (
        (dto.decision === 'approved' &&
          hospitalProfile.verificationStatus === 'approved') ||
        (dto.decision === 'flagged' &&
          hospitalProfile.verificationStatus === 'flagged')
      ) {
        throw new ConflictException(
          `Organization is already ${hospitalProfile.verificationStatus}. Cannot re-process.`,
        );
      }

      // Update the profile
      const updatedProfile = await this.prisma.hospitalProfile.update({
        where: { organizationId },
        data: {
          verificationStatus: dto.decision,
          trustScore:
            dto.decision === 'approved' ? 50 : hospitalProfile.trustScore,
        },
      });

      this.logger.log(
        `Organization ${organizationId} review: ${dto.decision}${dto.reason ? ` (Reason: ${dto.reason})` : ''}`,
      );

      return updatedProfile;
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to review hospital: ${message}`);
      throw new BadRequestException(`Failed to review hospital: ${message}`);
    }
  }

  /**
   * Get organization verification status
   * Validates that requester is a member of the organization
   */
  async getOrganizationStatus(organizationId: string, userId: string) {
    try {
      // Verify user is a member of the organization
      const isMember = await this.prisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId,
          },
        },
      });

      if (!isMember) {
        throw new Error('User is not a member of this organization');
      }

      const hospitalProfile = await this.prisma.hospitalProfile.findUnique({
        where: { organizationId },
      });

      if (!hospitalProfile) {
        throw new NotFoundException(
          `Hospital profile not found for organization ${organizationId}`,
        );
      }

      // Fetch organization details
      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          createdAt: true,
        },
      });

      return {
        organization,
        verificationStatus: hospitalProfile.verificationStatus,
        trustScore: hospitalProfile.trustScore,
        licenseDocUrl: hospitalProfile.licenseDocUrl,
        address: hospitalProfile.address,
        createdAt: hospitalProfile.createdAt,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';

      if (message.includes('not a member')) {
        throw new BadRequestException(
          `You must be a member of organization ${organizationId} to view its status`,
        );
      }

      this.logger.error(`Failed to get organization status: ${message}`);
      throw new BadRequestException(
        `Failed to get organization status: ${message}`,
      );
    }
  }
}
