import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/catalogo/components/home/home').then((m) => m.Home),
  },
  {
    path: 'produtos',
    loadComponent: () => import('./features/catalogo/components/listagem/listagem').then((m) => m.Listagem),
  },
  {
    path: 'produtos/:id',
    loadComponent: () => import('./features/catalogo/components/detalhe/detalhe').then((m) => m.Detalhe),
  },
  {
    path: 'carrinho',
    loadComponent: () =>
      import('./features/carrinho/components/carrinho-pagina/carrinho-pagina').then((m) => m.CarrinhoPagina),
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./features/checkout/components/checkout-pagina/checkout-pagina').then((m) => m.CheckoutPagina),
  },
  {
    path: 'pedido',
    loadComponent: () => import('./features/pedido/components/consulta/consulta').then((m) => m.Consulta),
  },
  {
    path: 'privacidade',
    loadComponent: () =>
      import('./features/institucional/components/privacidade/privacidade').then((m) => m.Privacidade),
  },
  {
    path: 'termos',
    loadComponent: () => import('./features/institucional/components/termos/termos').then((m) => m.Termos),
  },
  {
    path: 'admin/auth/login',
    loadComponent: () => import('./features/admin/auth/components/login/login').then((m) => m.Login),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./features/admin/admin-shell/admin-shell').then((m) => m.AdminShell),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/components/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'produtos',
        loadComponent: () => import('./features/admin/produtos/components/lista/lista').then((m) => m.Lista),
      },
      {
        path: 'produtos/novo',
        loadComponent: () => import('./features/admin/produtos/components/form/form').then((m) => m.Form),
      },
      {
        path: 'produtos/:id/editar',
        loadComponent: () => import('./features/admin/produtos/components/form/form').then((m) => m.Form),
      },
      {
        path: 'pre-venda',
        loadComponent: () => import('./features/admin/pre-venda/components/lista/lista').then((m) => m.Lista),
      },
      {
        path: 'pedidos',
        loadComponent: () => import('./features/admin/pedidos/components/lista/lista').then((m) => m.Lista),
      },
      {
        path: 'pedidos/:id',
        loadComponent: () =>
          import('./features/admin/pedidos/components/detalhe/detalhe').then((m) => m.Detalhe),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
