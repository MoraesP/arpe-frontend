import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { map, of, switchMap } from 'rxjs';
import { Carrinho } from '../../../../core/services/carrinho';
import { MoedaPipe } from '../../../../shared/pipes/moeda-pipe';
import { BadgePreVenda } from '../../../../shared/components/badge-pre-venda/badge-pre-venda';
import { ProdutoService } from '../../services/produto-service';

@Component({
  selector: 'app-detalhe',
  imports: [FormsModule, MoedaPipe, BadgePreVenda],
  templateUrl: './detalhe.html',
  styleUrl: './detalhe.scss',
})
export class Detalhe {
  private readonly route = inject(ActivatedRoute);
  private readonly produtoService = inject(ProdutoService);
  private readonly carrinho = inject(Carrinho);

  private readonly id = toSignal(this.route.paramMap.pipe(map((params) => params.get('id') ?? '')), {
    initialValue: '',
  });

  protected readonly produto = toSignal(
    toObservable(this.id).pipe(switchMap((id) => (id ? this.produtoService.detalhe(id) : of(null)))),
    { initialValue: null },
  );

  protected readonly quantidade = signal(1);
  protected readonly adicionado = signal(false);

  adicionarAoCarrinho(): void {
    const produto = this.produto();
    if (!produto) {
      return;
    }

    this.carrinho.adicionar({
      productId: produto.id,
      name: produto.name,
      photoUrl: produto.photoUrl,
      priceCents: produto.priceCents,
      isPresale: produto.isPresale,
      presaleDepositAmountCents: produto.presaleDepositAmountCents,
      quantity: this.quantidade(),
    });

    this.adicionado.set(true);
  }
}
