import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Min } from 'class-validator';
import { Type }               from 'class-transformer';
import { HousingType, MaritalStatus } from '@prisma/client';

export class CreateFamilyInfoDto {
  @ApiProperty({ enum: MaritalStatus, example: MaritalStatus.SINGLE })
  @IsEnum(MaritalStatus, { message: 'Estado civil inválido' })
  maritalStatus: MaritalStatus;

  @ApiProperty({ example: 0, description: 'Número de hijos' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  numberOfChildren: number;

  @ApiProperty({ enum: HousingType, example: HousingType.RENTED })
  @IsEnum(HousingType, { message: 'Tipo de vivienda inválido' })
  housingType: HousingType;
}
