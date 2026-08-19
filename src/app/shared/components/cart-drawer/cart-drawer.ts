import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Carrinho } from '../../../core/services/carrinho';
import { CartItem } from '../../../features/carrinho/models/cart-item';
import { MoedaPipe } from '../../pipes/moeda-pipe';

/**
 * Painel lateral que abre automaticamente ao adicionar um item ao
 * carrinho -- so lista os itens e leva para /carrinho ou /checkout,
 * conforme pedido do usuario.
 */
@Component({
  selector: 'app-cart-drawer',
  imports: [MoedaPipe],
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.scss',
})
export class CartDrawer {
  protected readonly carrinho = inject(Carrinho);
  private readonly router = inject(Router);

  fechar(): void {
    this.carrinho.fecharDrawer();
  }

  remover(productId: string): void {
    this.carrinho.remover(productId);
  }

  irPara(caminho: string): void {
    this.carrinho.fecharDrawer();
    this.router.navigate([caminho]);
  }

  subtotalItem(item: CartItem): number {
    const unitario = item.isPresale ? (item.presaleDepositAmountCents ?? 0) : item.priceCents;
    return unitario * item.quantity;
  }
}
