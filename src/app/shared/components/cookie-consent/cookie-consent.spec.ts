import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { CookieConsent } from './cookie-consent';

const STORAGE_KEY = 'arpe-cookie-consent';

describe('CookieConsent', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  function criarComponente(platform: 'browser' | 'server' = 'browser') {
    TestBed.configureTestingModule({
      imports: [CookieConsent],
      providers: [provideRouter([]), { provide: PLATFORM_ID, useValue: platform }],
    });
    const fixture = TestBed.createComponent(CookieConsent);
    fixture.detectChanges();
    return fixture;
  }

  it('exibe o aviso na primeira visita (sem consentimento salvo)', () => {
    const fixture = criarComponente();
    expect(fixture.componentInstance['visivel']()).toBe(true);
  });

  it('não exibe o aviso quando já houver consentimento salvo', () => {
    localStorage.setItem(STORAGE_KEY, 'aceito');
    const fixture = criarComponente();
    expect(fixture.componentInstance['visivel']()).toBe(false);
  });

  it('aceitar() esconde o aviso e salva o consentimento', () => {
    const fixture = criarComponente();
    fixture.componentInstance.aceitar();
    expect(fixture.componentInstance['visivel']()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('aceito');
  });

  it('não exibe o aviso durante SSR (fora do browser)', () => {
    const fixture = criarComponente('server');
    expect(fixture.componentInstance['visivel']()).toBe(false);
  });

  it('aceitar() fora do browser não toca localStorage, só esconde o aviso', () => {
    const fixture = criarComponente('server');
    fixture.componentInstance.aceitar();
    expect(fixture.componentInstance['visivel']()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
