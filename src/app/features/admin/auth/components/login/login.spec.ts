import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Login } from './login';
import { AdminAuthService } from '../../services/admin-auth-service';

describe('Login', () => {
  let adminAuthService: jasmine.SpyObj<AdminAuthService>;
  let router: Router;

  beforeEach(() => {
    adminAuthService = jasmine.createSpyObj<AdminAuthService>('AdminAuthService', ['login']);

    TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), { provide: AdminAuthService, useValue: adminAuthService }],
    });
    router = TestBed.inject(Router);
  });

  function criarFixture() {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    return fixture;
  }

  it('entrar() com sucesso navega para o dashboard', () => {
    adminAuthService.login.and.returnValue(of({ token: 'jwt-fake' }));
    spyOn(router, 'navigate');
    const fixture = criarFixture();

    fixture.componentInstance['email'].set('admin@arpe.com.br');
    fixture.componentInstance['senha'].set('senha123');
    fixture.componentInstance.entrar();

    expect(adminAuthService.login).toHaveBeenCalledWith('admin@arpe.com.br', 'senha123');
    expect(router.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
    expect(fixture.componentInstance['erro']()).toBe(false);
  });

  it('entrar() com falha exibe erro e não navega', () => {
    adminAuthService.login.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 401 })),
    );
    spyOn(router, 'navigate');
    const fixture = criarFixture();

    fixture.componentInstance.entrar();

    expect(fixture.componentInstance['erro']()).toBe(true);
    expect(fixture.componentInstance['carregando']()).toBe(false);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('entrar() liga carregando() e limpa erro() anterior antes de chamar o serviço', () => {
    adminAuthService.login.and.returnValue(of({ token: 'jwt-fake' }));
    const fixture = criarFixture();
    fixture.componentInstance['erro'].set(true);

    fixture.componentInstance.entrar();

    expect(adminAuthService.login).toHaveBeenCalled();
    expect(fixture.componentInstance['erro']()).toBe(false);
  });
});
