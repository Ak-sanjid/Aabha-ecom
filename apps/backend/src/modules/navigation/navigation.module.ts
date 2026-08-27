import { Module } from '@nestjs/common';
import { AdminNavigationController, NavigationController } from './navigation.controller';
import { NavigationService } from './navigation.service';

@Module({
  controllers: [NavigationController, AdminNavigationController],
  providers: [NavigationService],
  exports: [NavigationService],
})
export class NavigationModule {}
