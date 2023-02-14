import { VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true })
  );

  app.enableCors({
    allowedHeaders: "*"
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });

  await app.listen(3001);
}
bootstrap();
