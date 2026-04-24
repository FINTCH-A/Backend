import { ApiPropertyOptional }        from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type }                        from 'class-transformer';
import { HousingType, MaritalStatus }  from '@prisma/client';

export class UpdateFamilyInfoDto {
  @ApiPropertyOptional({ enum: MaritalStatus })
  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  numberOfChildren?: number;

  @ApiPropertyOptional({ enum: HousingType })
  @IsOptional()
  @IsEnum(HousingType)
  housingType?: HousingType;
}
