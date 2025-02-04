import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpEvent,
  HttpHandler,
  HttpRequest,
} from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { CacheService } from '../services/cache.service';

@Injectable()
export class CachingInterceptor implements HttpInterceptor {

  private cacheList: string[] = ['/api/Dashboard/GetSubjectDashboard', '/api/LovContant' ];

  constructor(private cacheService: CacheService) {}
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // ตรวจสอบว่า token มีอยู่ใน localStorage หรือไม่
    const token = localStorage.getItem('token');

    // หากมี token, จะใส่ใน Authorization header
    let requestinjected = request;

    if (token) {
      requestinjected = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    // if (request.method !== 'GET') {
    //   return next.handle(requestinjected); // แค่ Cache GET Requests
    // }

    if (!this.canCache(request)) {
      return next.handle(requestinjected);
    }
    const cache = this.cacheService.getCache(request.urlWithParams);
    if (cache) {
      return of(cache);
    }
    return next.handle(requestinjected).pipe(
      tap((res) => {
        this.cacheService.setCache(request.urlWithParams, res);
      })
    );
  }

  canCache(request: HttpRequest<unknown>): boolean {
    // return request.urlWithParams.includes('/api/MasterData');
    return (
      request.method === 'GET' ||
      (request.method === 'POST' &&
        this.cacheList.some((url) => request.url.includes(url)))
    );
  }
}