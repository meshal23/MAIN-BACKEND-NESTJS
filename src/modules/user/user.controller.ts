import { Controller, Get, Param } from '@nestjs/common';
import { Roles } from '@thallesp/nestjs-better-auth';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('all')
  @Roles(['ADMIN'])
  async getAllUsers() {
    const users = await this.userService.getAllUsers();
    return {
      status: 'success',
      data: users,
      count: users.length,
    };
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.userService.getUserById(id);
    return {
      status: 'success',
      data: user,
    };
  }
}
