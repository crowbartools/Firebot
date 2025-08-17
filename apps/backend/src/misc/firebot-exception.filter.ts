import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { FirebotException } from "./firebot.exception";
import type { FastifyRequest, FastifyReply } from "fastify";

@Catch(FirebotException)
export class FirebotExceptionFilter implements ExceptionFilter {
  catch(exception: FirebotException, host: ArgumentsHost) {
    const { httpStatus, httpMessage, metadata, message, stack } = exception;

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    console.error(message, stack, metadata);

    response.status(httpStatus).send({
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: httpMessage,
      metadata,
    });
  }
}
