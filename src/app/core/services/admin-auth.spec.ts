import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { AdminAuth } from './admin-auth';

const TOKEN_KEY = 'arpe-admin-token';

/** Monta um JWT sintático válido (header.payload.assinatura) com o `exp` desejado -- assinatura não é validada no frontend. */
function criarJwt(expSegundos: number | undefined): string {
  const base64url = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const payload = expSegundos === undefined ? {} : { exp: expSegundos };
  return `${base64url({ alg: 'HS256' })}.${base64url(payload)}.assinatura-fake`;
}

describe('AdminAuth', () => {
  beforeEach(() => {
    localStorage.removeItem(TOKEN_KEY);
  });

  function criarServico(platform: 'browser' | 'server' = 'browser'): AdminAuth {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: platform }],
    });
    return TestBed.inject(AdminAuth);
  }

  it('getToken() retorna null quando não há token salvo', () => {
    const adminAuth = criarServico();
    expect(adminAuth.getToken()).toBeNull();
  });

  it('setToken()/getToken() gravam e leem o token em localStorage', () => {
    const adminAuth = criarServico();
    adminAuth.setToken('jwt-fake');
    expect(adminAuth.getToken()).toBe('jwt-fake');
    expect(localStorage.getItem(TOKEN_KEY)).toBe('jwt-fake');
  });

  it('clearToken() remove o token', () => {
    const adminAuth = criarServico();
    adminAuth.setToken('jwt-fake');
    adminAuth.clearToken();
    expect(adminAuth.getToken()).toBeNull();
  });

  it('isAuthenticated() reflete a presença do token', () => {
    const adminAuth = criarServico();
    expect(adminAuth.isAuthenticated()).toBe(false);
    adminAuth.setToken('jwt-fake');
    expect(adminAuth.isAuthenticated()).toBe(true);
  });

  it('isAuthenticated() é true para um JWT com exp no futuro', () => {
    const adminAuth = criarServico();
    const futuro = Math.floor(Date.now() / 1000) + 3600;
    adminAuth.setToken(criarJwt(futuro));
    expect(adminAuth.isAuthenticated()).toBe(true);
  });

  it('isAuthenticated() é false e limpa o token quando o JWT já expirou', () => {
    const adminAuth = criarServico();
    const passado = Math.floor(Date.now() / 1000) - 3600;
    adminAuth.setToken(criarJwt(passado));

    expect(adminAuth.isAuthenticated()).toBe(false);
    expect(adminAuth.getToken()).toBeNull();
  });

  it('isAuthenticated() é true quando o token não tem claim exp (não dá pra saber se expirou)', () => {
    const adminAuth = criarServico();
    adminAuth.setToken(criarJwt(undefined));
    expect(adminAuth.isAuthenticated()).toBe(true);
  });

  it('fora do browser (SSR), nunca toca o localStorage', () => {
    const adminAuth = criarServico('server');
    adminAuth.setToken('jwt-fake');
    expect(adminAuth.getToken()).toBeNull();
    expect(adminAuth.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});
