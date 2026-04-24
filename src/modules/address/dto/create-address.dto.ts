import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAddressDto {
  @ApiProperty({ example: 'Perú' })
  @IsString()
  @IsNotEmpty({ message: 'El país es requerido' })
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  country: string;

  @ApiProperty({ example: 'Junín' })
  @IsString()
  @IsNotEmpty({ message: 'El departamento es requerido' })
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  department: string;

  @ApiProperty({ example: 'Huancayo' })
  @IsString()
  @IsNotEmpty({ message: 'La ciudad es requerida' })
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  city: string;

  @ApiProperty({ example: 'El Tambo' })
  @IsString()
  @IsNotEmpty({ message: 'El distrito es requerido' })
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  district: string;

  @ApiProperty({ example: 'Av. Giráldez 123' })
  @IsString()
  @IsNotEmpty({ message: 'La dirección es requerida' })
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  streetAddress: string;

  @ApiPropertyOptional({ example: '12001' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => value?.trim())
  postalCode?: string;
}
