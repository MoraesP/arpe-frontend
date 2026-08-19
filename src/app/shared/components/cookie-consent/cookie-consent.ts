import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

const STORAGE_KEY = 'arpe-cookie-consent';

/**
 * Aviso de cookies/LGPD exibido uma vez na primeira visita -- nao bloqueia
 * navegacao nem checkout (a decisao de "sem gate obrigatorio" ja tomada em
 * docs/specs/carrinho-checkout.md continua valendo, isso e so um aviso
 * dispensavel).
 */
@Component({
  selector: 'app-cookie-consent',
  imports: [RouterLink],
  templateUrl: './cookie-consent.html',
  styleUrl: './cookie-consent.scss',
})
export class CookieConsent {
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly visivel = signal(this.deveExibir());

  aceitar(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, 'aceito');
    }
    this.visivel.set(false);
  }

  private deveExibir(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    return localStorage.getItem(STORAGE_KEY) === null;
  }
}
