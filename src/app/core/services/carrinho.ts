import { effect, Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CartItem } from '../../features/carrinho/models/cart-item';

const STORAGE_KEY = 'arpe-carrinho';

/**
 * Carrinho client-side, sem entidade propria no backend -- estado em
 * memoria/localStorage via signals, coerente com a decisao da V1 de nao
 * ter carrinho persistente entre sessoes (ver docs/specs/carrinho-checkout.md
 * e docs/architecture/overview.md).
 */
@Injectable({ providedIn: 'root' })
export class Carrinho {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly _itens = signal<CartItem[]>(this.carregarDoStorage());
  readonly itens = this._itens.asReadonly();

  private readonly _drawerAberto = signal(false);
  readonly drawerAberto = this._drawerAberto.asReadonly();

  readonly totalItens = computed(() => this._itens().reduce((total, item) => total + item.quantity, 0));

  readonly temPreVenda = computed(() => this._itens().some((item) => item.isPresale));

  readonly totalCents = computed(() =>
    this._itens().reduce((total, item) => {
      const valorUnitario = item.isPresale ? (item.presaleDepositAmountCents ?? 0) : item.priceCents;
      return total + valorUnitario * item.quantity;
    }, 0),
  );

  constructor() {
    effect(() => this.salvarNoStorage(this._itens()));
  }

  adicionar(item: CartItem): void {
    this._itens.update((itens) => {
      const existente = itens.find((i) => i.productId === item.productId);
      if (existente) {
        return itens.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i,
        );
      }
      return [...itens, item];
    });
    this._drawerAberto.set(true);
  }

  abrirDrawer(): void {
    this._drawerAberto.set(true);
  }

  fecharDrawer(): void {
    this._drawerAberto.set(false);
  }

  atualizarQuantidade(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.remover(productId);
      return;
    }
    this._itens.update((itens) => itens.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
  }

  remover(productId: string): void {
    this._itens.update((itens) => itens.filter((i) => i.productId !== productId));
  }

  limpar(): void {
    this._itens.set([]);
  }

  private carregarDoStorage(): CartItem[] {
    if (!isPlatformBrowser(this.platformId)) {
      return [];
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  }

  private salvarNoStorage(itens: CartItem[]): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
  }
}
