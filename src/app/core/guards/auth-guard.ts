import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuth } from '../services/admin-auth';

/**
 * Protege as rotas admin/** -- redireciona para o login se nao houver JWT
 * valido em localStorage. Rotas admin sao client-rendered (ver
 * app.routes.server.ts), entao o ramo SSR abaixo e so uma rede de
 * seguranca, na pratica nao roda.
 */
export const authGuard: CanActivateFn = () => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return true;
  }

  if (inject(AdminAuth).isAuthenticated()) {
    return true;
  }

  inject(Router).navigate(['/admin/auth/login']);
  return false;
};
