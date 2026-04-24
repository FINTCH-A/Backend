import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { Observable } from 'rxjs';
  import { map } from 'rxjs/operators';

  export interface ApiResponse<T> {
    success:   boolean;
    data:      T;
    timestamp: string;
  }

  @Injectable()
  export class ResponseInterceptor<T>
    implements NestInterceptor<T, ApiResponse<T>>
  {
    constructor(private readonly reflector: Reflector) {}

    intercept(
      _context: ExecutionContext,
      next: CallHandler,
    ): Observable<ApiResponse<T>> {
      return next.handle().pipe(
        map((data) => ({
          success:   true,
          data,
          timestamp: new Date().toISOString(),
        })),
      );
    }
  }
