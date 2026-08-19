import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Carrinho } from '../../../../core/services/carrinho';
import { CartItem } from '../../models/cart-item';
import { MoedaPipe } from '../../../../shared/pipes/moeda-pipe';

@Component({
  selector: 'app-carrinho-pagina',
  imports: [RouterLink, MoedaPipe],
  templateUrl: './carrinho-pagina.html',
  styleUrl: './carrinho-pagina.scss',
})
export class CarrinhoPagina {
  protected readonly carrinho = inject(Carrinho);
  private readonly router = inject(Router);

  subtotalItem(item: CartItem): number {
    const unitario = item.isPresale ? (item.presaleDepositAmountCents ?? 0) : item.priceCents;
    return unitario * item.quantity;
  }

  incrementar(item: CartItem): void {
    this.carrinho.atualizarQuantidade(item.productId, item.quantity + 1);
  }

  decrementar(item: CartItem): void {
    this.carrinho.atualizarQuantidade(item.productId, item.quantity - 1);
  }

  remover(productId: string): void {
    this.carrinho.remover(productId);
  }

  irParaCheckout(): void {
    this.router.navigate(['/checkout']);
  }
}
