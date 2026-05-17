import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { stripSensitiveFields } from '../utils/sanitize-response.util';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors: null;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'data' in data
        ) {
          const wrapped = data as ApiResponse<T>;
          return {
            ...wrapped,
            data: stripSensitiveFields(wrapped.data) as T,
          };
        }
        return {
          success: true,
          data: stripSensitiveFields(data ?? null) as T,
          message: 'Success',
          errors: null,
        };
      }),
    );
  }
}
