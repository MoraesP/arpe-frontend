import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AdminAuth } from '../services/admin-auth';

/**
 * Se qualquer chamada admin (exceto o próprio login) responder 401, o
 * token não serve mais (expirado, revogado ou nunca chegou a ser
 * enviado) -- limpa a sessão e manda pro login, em vez de deixar o
 * painel numa tela sem dados sem explicar por quê.
 */
export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const isRotaAdmin = req.url.includes('/admin/') && !req.url.endsWith('/admin/auth/login');
  // inject() só é valido de forma sincrona aqui, no corpo do interceptor --
  // dentro do catchError (callback assincrono) lançaria NG0203
  const adminAuth = inject(AdminAuth);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (isRotaAdmin && err instanceof HttpErrorResponse && err.status === 401) {
        adminAuth.clearToken();
        router.navigate(['/admin/auth/login']);
      }
      return throwError(() => err);
    }),
  );
};
