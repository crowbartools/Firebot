import { Module } from "@nestjs/common";
import { RealTimeGateway } from "./real-time.gateway";

@Module({
  imports: [],
  controllers: [],
  providers: [RealTimeGateway],
})
export class RealTimeModule {}
