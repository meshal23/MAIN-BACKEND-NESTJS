import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { HackathonService } from './hackathon.service';
import { CreateHackathonDto } from './dto/create-hackathon.dto';
import { UpdateHackathonDto } from './dto/update-hackathon.dto';
import {
  AuthGuard,
  Roles,
  Session, // ✅ Changed from CurrentUser to Session
} from '@thallesp/nestjs-better-auth';

// ✅ Custom Type to completely bypass the namespace error
type BetterAuthSession = {
  user: {
    id: string;
    email: string;
    role: string;
    [key: string]: any;
  };
  session: {
    id: string;
    token: string;
    [key: string]: any;
  };
};

@Controller('api/hackathons')
export class HackathonController {
  constructor(private readonly hackathonService: HackathonService) {}

  @Post()
  @UseGuards(AuthGuard)
  @Roles(['ADMIN'])
  async create(
    @Body() createHackathonDto: CreateHackathonDto,
    @Session() session: BetterAuthSession,
  ) {
    const hackathon = await this.hackathonService.create(
      createHackathonDto,
      session.user.id, // ✅ Accessed from session.user
    );
    return {
      message: 'Hackathon created successfully',
      data: hackathon,
    };
  }

  @Get()
  async findAll() {
    return this.hackathonService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.hackathonService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @Roles(['ADMIN'])
  async update(
    @Param('id') id: string,
    @Body() updateHackathonDto: UpdateHackathonDto,
    @Session() session: BetterAuthSession, 
  ) {
    const hackathon = await this.hackathonService.update(
      id,
      updateHackathonDto,
      session.user.id, // ✅ Accessed from session.user
      session.user.role, // ✅ Accessed from session.user
    );
    return {
      message: 'Hackathon updated successfully',
      data: hackathon,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Roles(['ADMIN'])
  async remove(
    @Param('id') id: string,
    @Session() session: BetterAuthSession, 
  ) {
    await this.hackathonService.remove(id, session.user.id, session.user.role);
    return {
      message: 'Hackathon deleted successfully',
    };
  }
}
