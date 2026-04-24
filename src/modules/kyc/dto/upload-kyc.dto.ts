import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UploadKycDto {
  @ApiPropertyOptional({ description: 'URL del documento frontal (DNI)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  documentFront?: string;

  @ApiPropertyOptional({ description: 'URL del documento trasero (DNI)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  documentBack?: string;

  @ApiPropertyOptional({ description: 'URL de la selfie del usuario' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  selfie?: string;
}
