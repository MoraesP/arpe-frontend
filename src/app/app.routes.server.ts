import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * SSR so nas paginas de catalogo (indexacao por buscadores, ver PRD 3).
 * Carrinho, checkout, consulta de pedido e todo /admin operam como SPA
 * pura pos-hidratacao -- ver docs/architecture/overview.md.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Server },
  { path: 'produtos', renderMode: RenderMode.Server },
  { path: 'produtos/:id', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Client },
];
