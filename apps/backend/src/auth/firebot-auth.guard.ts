import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Observable } from "rxjs";
import { FastifyRequest } from "fastify";
import { AuthService } from "auth/auth.service";

@Injectable()
export class FirebotAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const authToken = request.headers["auth"];
    return this.authService.authToken === authToken;
  }
}
