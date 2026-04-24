import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marca el endpoint como público — no requiere JWT */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
