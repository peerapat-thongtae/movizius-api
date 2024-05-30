import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategy/jwt.strategy';
import { MediasModule } from 'src/medias/medias.module';
@Module({
  imports: [
    forwardRef(() => MediasModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // Auth0Module.register(a),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [PassportModule],
})
export class AuthModule {}
