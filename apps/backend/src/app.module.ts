import { resolve } from "node:path";
import { Module } from "@nestjs/common";
import { ServeStaticModule } from '@nestjs/serve-static';
import { ExampleController } from "./example.controller";



@Module({
  imports: [
    ServeStaticModule.forRoot({
        rootPath: resolve(__dirname, '../../frontend/dist'),
        exclude: ['/api/*']
    })
  ],
  controllers: [ExampleController],
  providers: [],
})
export class AppModule {}
