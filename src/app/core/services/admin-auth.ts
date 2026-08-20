import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const TOKEN_KEY = 'arpe-admin-token';

/**
 * Guarda o JWT do AdminUser em localStorage -- unico perfil autenticado da
 * V1 (ver docs/architecture/overview.md#autenticacao-administrativa).
 */
@Injectable({ providedIn: 'root' })
export class AdminAuth {
  private readonly platformId = inject(PLATFORM_ID);

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    localStorage.setItem(TOKEN_KEY, token);
  }

  clearToken(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    localStorage.removeItem(TOKEN_KEY);
  }

  /**
   * Checa presença E validade (claim `exp`) do token -- um JWT expirado
   * ainda "presente" no localStorage não deve deixar o guard liberar a
   * rota admin (achado real: token expirado deixava o painel renderizar
   * vazio, sem redirecionar pro login, porque só a presença era checada).
   * Isso é só uma camada de UX: a validação de verdade (assinatura,
   * expiração) é sempre feita pelo backend, ver JwtService.
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    if (this.estaExpirado(token)) {
      this.clearToken();
      return false;
    }
    return true;
  }

  private estaExpirado(token: string): boolean {
    const exp = this.extrairExpiracao(token);
    return exp !== null && exp * 1000 <= Date.now();
  }

  /** Decodifica o payload do JWT sem validar assinatura -- só leitura local do claim `exp`. */
  private extrairExpiracao(token: string): number | null {
    try {
      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.exp === 'number' ? payload.exp : null;
    } catch {
      return null;
    }
  }
}
