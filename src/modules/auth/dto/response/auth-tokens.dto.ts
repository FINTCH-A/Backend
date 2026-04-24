import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensDto {
  @ApiProperty({ description: 'JWT de acceso — expira en 15m' })
  accessToken: string;

  @ApiProperty({ description: 'JWT de refresco — expira en 7d' })
  refreshToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: string;

  @ApiProperty({ example: '15m' })
  expiresIn: string;
}
