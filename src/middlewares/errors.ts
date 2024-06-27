import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'

/*
  - This middleware handles errors that occur in the application.
  - A middleware is used instead of a controller because errors can occur
    anywhere in the application, not just in the controllers.
*/
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch (exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest()
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Something went wrong, but it\'s not your fault.'

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message
    })
  }
}
