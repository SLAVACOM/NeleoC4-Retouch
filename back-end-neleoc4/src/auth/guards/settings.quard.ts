import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { RoleEnum, Workers } from '@prisma/client';

@Injectable()
export class OnlySettingsManagerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ worker: Workers }>();
    const user = request.worker;

    if (
      !user.roles.includes(RoleEnum.SETTINGS_MANAGER) &&
      !user.roles.includes(RoleEnum.ADMIN)
    )
      throw new ForbiddenException('У вас нет прав!');
    if (user.isDelete)
      throw new ForbiddenException('Пользователь заблокирован!');
    return true;
  }
}
