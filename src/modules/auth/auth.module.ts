import { Module }        from '@nestjs/common';
import { JwtModule }     from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule }  from '@nestjs/config';

import { AuthController }  from './auth.controller';
import { AuthService }     from './auth.service';
import { AuthRepository }  from './auth.repository';
import { JwtStrategy }     from '../../config/jwt/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}), // configuración dinámica en el service
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    JwtStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
