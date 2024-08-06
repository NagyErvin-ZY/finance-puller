import {
    CallHandler,
    ExecutionContext,
    Inject,
    Injectable,
    NestInterceptor,
  } from '@nestjs/common';
  import { Observable, of, throwError } from 'rxjs';
  import { catchError, map, tap } from 'rxjs/operators';
  import { level, Logger } from 'winston';

import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { randomUUID } from 'crypto';
  
  @Injectable()
  export class LoggingInterceptor implements NestInterceptor {
    constructor(@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger) {}
  
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const request = context.switchToHttp().getRequest();
      const { method, url, headers, body, params, query, ip } = request;
      const now = Date.now();
      const requestId = randomUUID();

      // Attach requestId to the request object
      request.requestId = requestId;

      this.logger.debug(`Incoming Request [${requestId}]: ${method} ${url}`, {
        requestId,
        headers,
        params,
        query,
        body,
        ip,
      });
  
      return next.handle().pipe(
        tap((data) => {
          const response = context.switchToHttp().getResponse();
          const { statusCode, statusMessage } = response;
          this.logger.debug(`Outgoing Response [${requestId}]: ${statusCode} ${statusMessage} - ${Date.now() - now}ms`, {
            requestId,
            statusCode,
            statusMessage,
            data,
          });
          return data;
        })
      );
    }
  }