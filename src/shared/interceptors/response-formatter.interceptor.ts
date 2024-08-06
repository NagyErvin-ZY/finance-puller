import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import {
	getReasonPhrase,
} from 'http-status-codes';

@Injectable()
export class ResponseFormatInterceptor implements NestInterceptor {
    /**
     * Intercepts the response to format it in a standard structure.
     * @param {ExecutionContext} context - The execution context of the request.
     * @param {CallHandler} next - The next handler in the request pipeline.
     * @returns {Observable<any>} - The observable stream of the formatted response.
     */
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                const response = context.switchToHttp().getResponse();
                return {
                    statusCode: response.statusCode,
                    message: getReasonPhrase(response.statusCode),
                    data: data,
                };
            }),
        
        );
    }
}