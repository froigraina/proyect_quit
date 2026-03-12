import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentAuth } from '../auth/current-auth.decorator';
import { AuthContext } from '../auth/auth.types';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@CurrentAuth() auth: AuthContext) {
    return this.profileService.getProfile(auth.user.id);
  }

  @Get('settings-history')
  async getSettingsHistory(@CurrentAuth() auth: AuthContext) {
    return this.profileService.getSettingsHistory(auth.user.id);
  }

  @Patch()
  async updateProfile(
    @CurrentAuth() auth: AuthContext,
    @Body() payload: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(auth.user.id, payload);
  }

  @Post('onboarding')
  async completeOnboarding(
    @CurrentAuth() auth: AuthContext,
    @Body() payload: CompleteOnboardingDto,
  ) {
    return this.profileService.completeOnboarding(auth.user.id, payload);
  }
}
