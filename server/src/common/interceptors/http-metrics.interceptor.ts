import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Request, Response } from 'express';
import { Reflector } from '@nestjs/core';
import { PrometheusService } from '../../prometheus/prometheus.service';
import { PATH_METADATA } from '@nestjs/common/constants';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(
    private readonly prometheusService: PrometheusService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const method = req.method;
    const handler = context.getHandler();
    const controller = context.getClass();

    const controllerPath = this.reflector.get<string>(PATH_METADATA, controller) || '';
    const handlerPath = this.reflector.get<string>(PATH_METADATA, handler) || '';
    const route = `/${controllerPath}/${handlerPath}`.replace(/\/+/g, '/').replace(/\/$/, '') || req.path;

    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = (Date.now() - start) / 1000;
        const statusCode = res.statusCode.toString();
        this.prometheusService.incrementHttpRequests(method, route, statusCode);
        this.prometheusService.observeHttpRequestDuration(method, route, statusCode, duration);
        if (res.statusCode >= 400) {
          this.prometheusService.incrementHttpRequestErrors(method, route, statusCode);
        }
      }),
      catchError((error) => {
        const duration = (Date.now() - start) / 1000;
        const statusCode = (error.getStatus?.() || 500).toString();
        this.prometheusService.incrementHttpRequests(method, route, statusCode);
        this.prometheusService.observeHttpRequestDuration(method, route, statusCode, duration);
        this.prometheusService.incrementHttpRequestErrors(method, route, error.name || 'Unknown');
        return throwError(() => error);
      }),
    );
  }
}