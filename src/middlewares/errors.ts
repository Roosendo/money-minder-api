import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = "Internal server error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message =
        typeof res === "object" && res !== null && "message" in res ? (res as any).message : res;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case "P2025": {
          status = HttpStatus.NOT_FOUND;
          message = "Requested record not found";
          break;
        }
        case "P2002": {
          status = HttpStatus.CONFLICT;
          const target = Array.isArray(exception.meta?.target)
            ? exception.meta.target.join(", ")
            : "field";
          message = `Duplicate entry for ${target}`;
          break;
        }
        case "P2003": {
          status = HttpStatus.BAD_REQUEST;
          message = "Foreign key constraint failed";
          break;
        }
        default: {
          this.logger.error(
            `Prisma error [${exception.code}]: ${exception.message}`,
            exception.stack,
          );
          status = HttpStatus.BAD_REQUEST;
          message = "Database operation failed";
          break;
        }
      }
    } else {
      const err = exception as Error;
      this.logger.error(`Unhandled exception: ${err?.message || exception}`, err?.stack);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
