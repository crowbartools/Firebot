import { Global, Module } from "@nestjs/common";
import { ConnectionManagerService } from "./connection-manager.service";
import { ConnectableRegistryService } from "./connectable-registry.service";
import { ConnectionController } from "./connection.controller";

@Global()
@Module({
  imports: [],
  controllers: [ConnectionController],
  providers: [ConnectableRegistryService, ConnectionManagerService],
  exports: [ConnectableRegistryService],
})
export class ConnectionModule {}
