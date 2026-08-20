import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authErrorInterceptor } from './auth-error-interceptor';
import { AdminAuth } from '../services/admin-auth';

describe('authErrorInterceptor', () => {
  let httpMock: HttpTestingController;
  let http: HttpClient;
  let adminAuth: jasmine.SpyObj<AdminAuth>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    adminAuth = jasmine.createSpyObj<AdminAuth>('AdminAuth', ['clearToken']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: AdminAuth, useValue: adminAuth },
        { provide: Router, useValue: router },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    http = TestBed.inject(HttpClient);
  });

  afterEach(() => httpMock.verify());

  it('em 401 numa rota admin, limpa o token e redireciona pro login', () => {
    let erroCapturado: HttpErrorResponse | undefined;
    http.get('http://localhost:8080/api/admin/pedidos').subscribe({
      error: (err) => (erroCapturado = err),
    });

    httpMock
      .expectOne('http://localhost:8080/api/admin/pedidos')
      .flush('erro', { status: 401, statusText: 'Unauthorized' });

    expect(adminAuth.clearToken).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/auth/login']);
    expect(erroCapturado?.status).toBe(401);
  });

  it('em 401 na própria rota de login, não limpa token nem redireciona (é só a senha errada)', () => {
    http.post('http://localhost:8080/api/admin/auth/login', {}).subscribe({ error: () => {} });

    httpMock
      .expectOne('http://localhost:8080/api/admin/auth/login')
      .flush('erro', { status: 401, statusText: 'Unauthorized' });

    expect(adminAuth.clearToken).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('em outros códigos de erro (não 401), não mexe na sessão', () => {
    http.get('http://localhost:8080/api/admin/pedidos').subscribe({ error: () => {} });

    httpMock
      .expectOne('http://localhost:8080/api/admin/pedidos')
      .flush('erro', { status: 500, statusText: 'Internal Server Error' });

    expect(adminAuth.clearToken).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('em rota pública, 401 não mexe na sessão do admin', () => {
    http.get('http://localhost:8080/api/produtos').subscribe({ error: () => {} });

    httpMock
      .expectOne('http://localhost:8080/api/produtos')
      .flush('erro', { status: 401, statusText: 'Unauthorized' });

    expect(adminAuth.clearToken).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
