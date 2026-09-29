import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../lib/database/prisma.service';
import { CreateHackathonDto } from './dto/create-hackathon.dto';
import { UpdateHackathonDto } from './dto/update-hackathon.dto';

@Injectable()
export class HackathonService {
  constructor(private prisma: PrismaService) {}

  async create(createHackathonDto: CreateHackathonDto, authorId: string) {
    return this.prisma.hackathon.create({
      data: {
        name: createHackathonDto.name,
        description: createHackathonDto.description,
        startDate: createHackathonDto.startsAt,
        endDate: createHackathonDto.endsAt,
        isActive: createHackathonDto.isActive ?? true,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.hackathon.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        participants: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        participants: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    return hackathon;
  }

  async update(
    id: string,
    updateHackathonDto: UpdateHackathonDto,
    userId: string,
    userRole: string,
  ) {
    const hackathon = await this.findOne(id);

    if (hackathon.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'You can only update hackathons you created',
      );
    }

    return this.prisma.hackathon.update({
      where: { id },
      data: {
        name: updateHackathonDto.name,
        description: updateHackathonDto.description,
        startDate: updateHackathonDto.startsAt,
        endDate: updateHackathonDto.endsAt,
        isActive: updateHackathonDto.isActive,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string, userRole: string) {
    const hackathon = await this.findOne(id);

    if (hackathon.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'You can only delete hackathons you created',
      );
    }

    return this.prisma.hackathon.delete({
      where: { id },
    });
  }
}
