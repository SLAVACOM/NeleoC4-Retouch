import { UseGuards, applyDecorators } from '@nestjs/common';
import { RoleEnum } from '@prisma/client';
import { OnlyAdminGuard } from '../guards/admin.quard';
import { JwtAuthGuard } from '../guards/jwt.quard';
import { OnlySettingsManagerGuard } from '../guards/settings.quard';
import { OnlyVialsManagerGuard } from '../guards/vial.quard';

export const Auth = (role: RoleEnum = RoleEnum.VIALS_MANAGER) =>
  applyDecorators(
    role === RoleEnum.ADMIN
      ? UseGuards(JwtAuthGuard, OnlyAdminGuard)
      : role === RoleEnum.VIALS_MANAGER
        ? UseGuards(JwtAuthGuard, OnlyVialsManagerGuard)
        : role === RoleEnum.SETTINGS_MANAGER
          ? UseGuards(JwtAuthGuard, OnlySettingsManagerGuard)
          : UseGuards(JwtAuthGuard),
  );
