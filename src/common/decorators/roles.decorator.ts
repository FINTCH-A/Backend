import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Restringe el endpoint a los roles indicados */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
