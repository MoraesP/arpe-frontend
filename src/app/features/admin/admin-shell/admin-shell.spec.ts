import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AdminShell } from './admin-shell';
import { AdminAuth } from '../../../core/services/admin-auth';

describe('AdminShell', () => {
  let adminAuth: AdminAuth;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminShell],
      providers: [provideRouter([])],
    });
    adminAuth = TestBed.inject(AdminAuth);
    router = TestBed.inject(Router);
  });

  it('sair() limpa o token e redireciona para o login do admin', () => {
    const fixture = TestBed.createComponent(AdminShell);
    fixture.detectChanges();

    spyOn(adminAuth, 'clearToken');
    spyOn(router, 'navigate');

    fixture.componentInstance.sair();

    expect(adminAuth.clearToken).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/auth/login']);
  });
});
