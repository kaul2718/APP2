import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { User } from 'src/users/entities/user.entity';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Auth('admin', 'tech', 'recep', 'client')
  @Get('me')
  getMyDashboard(
    @CurrentUser() user: User,
    @Query('range') range?: string,
  ) {
    return this.dashboardService.getDashboardForUser(user, range);
  }

  @Auth('admin')
  @Get('admin')
  getAdminDashboard(@Query('range') range?: string) {
    return this.dashboardService.getAdminDashboard(range);
  }

  @Auth('admin', 'tech')
  @Get('tech')
  getTechDashboard(
    @CurrentUser() user: User,
    @Query('range') range?: string,
  ) {
    return this.dashboardService.getTechDashboard(user.id, range);
  }

  @Auth('admin', 'recep')
  @Get('recep')
  getRecepDashboard(
    @CurrentUser() user: User,
    @Query('range') range?: string,
  ) {
    return this.dashboardService.getRecepDashboard(user.id, range);
  }

  @Auth('admin', 'client')
  @Get('client')
  getClientDashboard(
    @CurrentUser() user: User,
    @Query('range') range?: string,
  ) {
    return this.dashboardService.getClientDashboard(user.id, range);
  }
}
