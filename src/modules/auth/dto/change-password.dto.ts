import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña actual es requerida' })
  currentPassword: string;

  @ApiProperty({
    example: 'NewPassword456!',
    description: 'Mínimo 8 caracteres, debe incluir mayúscula, minúscula y número',
  })
  @IsString()
  @MinLength(8, { message: 'Mínimo 8 caracteres' })
  @MaxLength(255)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Debe contener mayúscula, minúscula y número',
  })
  newPassword: string;
}
