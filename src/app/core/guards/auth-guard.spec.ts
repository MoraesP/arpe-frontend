import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, Injector, runInInjectionContext } from '@angular/core';
import { Router } from '@angular/router';
import { authGuard } from './auth-guard';
import { AdminAuth } from '../services/admin-auth';

describe('authGuard', () => {
  let adminAuth: jasmine.SpyObj<AdminAuth>;
  let router: jasmine.SpyObj<Router>;

  function configurar(platform: 'browser' | 'server' = 'browser'): Injector {
    adminAuth = jasmine.createSpyObj<AdminAuth>('AdminAuth', ['isAuthenticated']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: platform },
        { provide: AdminAuth, useValue: adminAuth },
        { provide: Router, useValue: router },
      ],
    });

    return TestBed.inject(Injector);
  }

  function executarGuard(injector: Injector) {
    return runInInjectionContext(injector, () => authGuard({} as any, {} as any));
  }

  it('permite o acesso quando o admin está autenticado', () => {
    const injector = configurar();
    adminAuth.isAuthenticated.and.returnValue(true);

    expect(executarGuard(injector)).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('bloqueia e redireciona para o login quando não está autenticado', () => {
    const injector = configurar();
    adminAuth.isAuthenticated.and.returnValue(false);

    expect(executarGuard(injector)).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/admin/auth/login']);
  });

  it('libera o acesso sem checar o token fora do browser (SSR)', () => {
    const injector = configurar('server');

    expect(executarGuard(injector)).toBe(true);
    expect(adminAuth.isAuthenticated).not.toHaveBeenCalled();
  });
});
