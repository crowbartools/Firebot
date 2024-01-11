import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { DataAccessModule } from "data-access/data-access.module";
import { AuthController } from "auth/auth.controller";

@Module({
  imports: [DataAccessModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
