import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategy/jwt.strategy';
import { MediasModule } from 'src/medias/medias.module';

// const a: any = {
//   domain: 'https://dev-dxsfu1ajem7xnzwi.us.auth0.com',
//   clientId: 'NSQ8ga8ggZ1faBYeebE0F8qNSLKj2Mt3',
//   clientSecret:
//     'HOIqLkwxonNBr6YjZxhIhMPglDhvyL3lHvr_7rOUBX4jONqs5RQe50NTGYocXEHy',
//   audience: 'http://localhost:4000',
//   namespace: 'http://localhost:4000',
//   passportOptions: {
//     t: 1,
//   },
// };
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
