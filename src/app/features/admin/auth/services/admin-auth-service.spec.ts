import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../../environments/environment';
import { AdminAuthService } from './admin-auth-service';
import { AdminAuth } from '../../../../core/services/admin-auth';

describe('AdminAuthService', () => {
  let service: AdminAuthService;
  let adminAuth: AdminAuth;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    service = TestBed.inject(AdminAuthService);
    adminAuth = TestBed.inject(AdminAuth);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('login() faz POST em /admin/auth/login com e-mail e senha', () => {
    service.login('admin@arpe.com.br', 'senha123').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/admin/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'admin@arpe.com.br', senha: 'senha123' });
    req.flush({ token: 'jwt-fake' });
  });

  it('login() salva o token retornado via AdminAuth', () => {
    spyOn(adminAuth, 'setToken');

    service.login('admin@arpe.com.br', 'senha123').subscribe();

    httpMock.expectOne(`${baseUrl}/admin/auth/login`).flush({ token: 'jwt-fake' });

    expect(adminAuth.setToken).toHaveBeenCalledWith('jwt-fake');
  });

  it('não salva token nenhum quando a requisição falha', () => {
    spyOn(adminAuth, 'setToken');

    service.login('admin@arpe.com.br', 'senha-errada').subscribe({ error: () => {} });

    httpMock
      .expectOne(`${baseUrl}/admin/auth/login`)
      .flush('credenciais inválidas', { status: 401, statusText: 'Unauthorized' });

    expect(adminAuth.setToken).not.toHaveBeenCalled();
  });
});
