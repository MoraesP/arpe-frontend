import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { AdminAuth } from './admin-auth';

const TOKEN_KEY = 'arpe-admin-token';

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

  it('fora do browser (SSR), nunca toca o localStorage', () => {
    const adminAuth = criarServico('server');
    adminAuth.setToken('jwt-fake');
    expect(adminAuth.getToken()).toBeNull();
    expect(adminAuth.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});
