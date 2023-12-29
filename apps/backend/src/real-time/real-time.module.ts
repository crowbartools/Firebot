import { Module } from "@nestjs/common";
import { RealTimeGateway } from "./real-time.gateway";
import { AuthModule } from "auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [],
  providers: [RealTimeGateway],
})
export class RealTimeModule {}
