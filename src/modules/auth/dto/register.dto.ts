import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @ApiProperty({ example: 'Juan' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiProperty({ example: 'Pérez García' })
  @IsString()
  @IsNotEmpty({ message: 'El apellido es requerido' })
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @ApiProperty({ example: '12345678', description: 'DNI peruano (8 dígitos)' })
  @IsString()
  @Matches(/^\d{8}$/, { message: 'El DNI debe tener exactamente 8 dígitos' })
  @Transform(({ value }) => value?.trim())
  dni: string;

  @ApiProperty({ example: 'juan.perez@email.com' })
  @IsEmail({}, { message: 'Correo electrónico inválido' })
  @MaxLength(255)
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ example: '+51987654321' })
  @IsString()
  @IsNotEmpty({ message: 'El teléfono es requerido' })
  @MaxLength(20)
  @Transform(({ value }) => value?.trim())
  phone: string;

  @ApiProperty({ example: '1995-08-20', description: 'Formato YYYY-MM-DD' })
  @IsDateString({}, { message: 'Formato de fecha inválido. Use YYYY-MM-DD' })
  dateOfBirth: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Mínimo 8 caracteres, debe incluir mayúscula, minúscula y número',
  })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(255)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'La contraseña debe contener mayúscula, minúscula y número',
  })
  password: string;
}
