import { Module } from '@nestjs/common';
import { AdminThemeController, ThemeController } from './theme.controller';
import { ThemeService } from './theme.service';

@Module({
  controllers: [ThemeController, AdminThemeController],
  providers: [ThemeService],
  exports: [ThemeService],
})
export class ThemeModule {}
