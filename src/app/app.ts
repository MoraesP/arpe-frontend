import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { map, startWith, filter } from 'rxjs';
import { Header } from './shared/components/header/header';
import { Footer } from './shared/components/footer/footer';
import { CartDrawer } from './shared/components/cart-drawer/cart-drawer';
import { CookieConsent } from './shared/components/cookie-consent/cookie-consent';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, CartDrawer, CookieConsent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);

  // admin tem nav/layout proprios (AdminShell) -- header/footer/carrinho/
  // aviso de cookies do site publico nao fazem sentido la, ver
  // docs/architecture/overview.md.
  protected readonly ehAdmin = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.startsWith('/admin')),
      startWith(this.router.url.startsWith('/admin')),
    ),
    { initialValue: this.router.url.startsWith('/admin') },
  );
}
