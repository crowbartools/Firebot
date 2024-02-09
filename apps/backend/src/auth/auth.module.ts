import { Global, Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "auth/auth.controller";
import { AuthProviderManager } from "auth/auth-provider-manager.service";
import { AuthProviderController } from "auth/auth-provider.controller";

@Global()
@Module({
  imports: [],
  controllers: [AuthProviderController, AuthController],
  providers: [AuthService, AuthProviderManager],
  exports: [AuthService, AuthProviderManager],
})
export class AuthModule {}
