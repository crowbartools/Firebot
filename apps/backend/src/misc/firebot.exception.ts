import { HttpStatus } from "@nestjs/common";

export class FirebotException extends Error {
  constructor(
    message?: string,
    public httpStatus: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    public httpMessage: string = "",
    public metadata: Record<string, unknown> = {}
  ) {
    super(message);
  }
}
