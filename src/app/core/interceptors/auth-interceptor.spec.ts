import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth-interceptor';
import { AdminAuth } from '../services/admin-auth';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let http: HttpClient;
  let adminAuth: jasmine.SpyObj<AdminAuth>;

  beforeEach(() => {
    adminAuth = jasmine.createSpyObj<AdminAuth>('AdminAuth', ['getToken']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AdminAuth, useValue: adminAuth },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    http = TestBed.inject(HttpClient);
  });

  afterEach(() => httpMock.verify());

  it('anexa o Bearer token em rotas /admin/**', () => {
    adminAuth.getToken.and.returnValue('jwt-fake');

    http.get('http://localhost:8080/api/admin/pedidos').subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/admin/pedidos');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-fake');
    req.flush({});
  });

  it('não anexa header nenhum quando não há token salvo', () => {
    adminAuth.getToken.and.returnValue(null);

    http.get('http://localhost:8080/api/admin/pedidos').subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/admin/pedidos');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('não anexa o token na rota de login do admin', () => {
    adminAuth.getToken.and.returnValue('jwt-fake');

    http.post('http://localhost:8080/api/admin/auth/login', {}).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/admin/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('não anexa o token em rotas públicas', () => {
    adminAuth.getToken.and.returnValue('jwt-fake');

    http.get('http://localhost:8080/api/produtos').subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/produtos');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('propaga erros da requisição normalmente', () => {
    adminAuth.getToken.and.returnValue('jwt-fake');
    let erroCapturado: HttpErrorResponse | undefined;

    http.get('http://localhost:8080/api/admin/pedidos').subscribe({
      error: (err) => (erroCapturado = err),
    });

    httpMock
      .expectOne('http://localhost:8080/api/admin/pedidos')
      .flush('erro', { status: 401, statusText: 'Unauthorized' });
    expect(erroCapturado?.status).toBe(401);
  });
});
