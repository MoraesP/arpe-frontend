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

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }
}
