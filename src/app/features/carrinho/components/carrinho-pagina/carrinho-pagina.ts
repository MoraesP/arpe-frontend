import { Component, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { Carrinho } from '../../../../core/services/carrinho';
import { ProdutoService } from '../../../catalogo/services/produto-service';
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
  private readonly produtoService = inject(ProdutoService);
  private readonly router = inject(Router);

  /**
   * Estoque atual buscado do backend (não confia no `stockQuantity`
   * congelado no item desde quando foi adicionado ao carrinho -- ele pode
   * estar desatualizado, seja por outra compra ter reduzido o estoque
   * nesse meio tempo, seja por ser um item que já estava no carrinho antes
   * desse campo existir).
   */
  private readonly estoqueAtual = toSignal(
    toObservable(this.carrinho.itens).pipe(
      switchMap((itens) => {
        const ids = [...new Set(itens.map((i) => i.productId))];
        if (ids.length === 0) {
          return of<Record<string, number>>({});
        }
        return forkJoin(
          ids.map((id) =>
            this.produtoService.detalhe(id).pipe(
              map((produto) => [id, produto.quantity] as const),
              catchError(() => of([id, 0] as const)),
            ),
          ),
        ).pipe(map((pares) => Object.fromEntries(pares)));
      }),
    ),
    { initialValue: {} as Record<string, number> },
  );

  subtotalItem(item: CartItem): number {
    const unitario = item.isPresale ? (item.presaleDepositAmountCents ?? 0) : item.priceCents;
    return unitario * item.quantity;
  }

  estoqueDisponivel(item: CartItem): number {
    return this.estoqueAtual()[item.productId] ?? item.stockQuantity;
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
