import { Global, Module } from "@nestjs/common";
import { RealTimeGateway } from "./real-time.gateway";

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [RealTimeGateway],
  exports: [RealTimeGateway],
})
export class RealTimeModule {}
