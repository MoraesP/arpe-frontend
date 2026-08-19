import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AdminAuth } from '../services/admin-auth';

/**
 * Anexa o JWT do admin nas chamadas para /admin/** (exceto o proprio
 * login) -- rotas publicas nao passam por autenticacao, ver
 * docs/architecture/overview.md#autenticacao-administrativa.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isRotaAdmin = req.url.includes('/admin/') && !req.url.endsWith('/admin/auth/login');

  if (isRotaAdmin) {
    const token = inject(AdminAuth).getToken();
    if (token) {
      req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }
  }

  return next(req);
};
