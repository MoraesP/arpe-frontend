import { Component, computed, effect, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { map, of, switchMap } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Carrinho } from '../../../../core/services/carrinho';
import { Seo } from '../../../../core/services/seo';
import { MoedaPipe } from '../../../../shared/pipes/moeda-pipe';
import { BadgePreVenda } from '../../../../shared/components/badge-pre-venda/badge-pre-venda';
import { ProdutoService } from '../../services/produto-service';
import { fotoCapa } from '../../models/product';

interface AvisoEstoque {
  texto: string;
  nivel: 'critico' | 'baixo';
}

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
  private readonly seo = inject(Seo);

  private readonly slug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('slug') ?? '')),
    {
      initialValue: '',
    },
  );

  protected readonly produto = toSignal(
    toObservable(this.slug).pipe(
      switchMap((slug) => (slug ? this.produtoService.detalhe(slug) : of(null))),
    ),
    { initialValue: null },
  );

  protected readonly quantidade = signal(1);
  protected readonly adicionado = signal(false);
  protected readonly erroQuantidade = signal<string | null>(null);

  constructor() {
    // Product schema (JSON-LD) é o que mais ajuda o produto aparecer em
    // buscas específicas (Google Shopping/rich results usam isso pra
    // mostrar preço/disponibilidade direto no resultado) -- roda no SSR,
    // então já sai pronto no HTML que o crawler vê, sem precisar executar
    // JS. Ver docs/architecture/overview.md#seo.
    effect(() => {
      const produto = this.produto();
      if (!produto) {
        return;
      }

      const imagem = fotoCapa(produto);
      const descricao =
        produto.description ?? `${produto.name} — colecionável diecast à venda na ArPe.`;
      const path = `/produtos/${produto.slug}`;

      this.seo.atualizar({
        title: produto.name,
        description: descricao,
        path,
        image: imagem ?? undefined,
        type: 'product',
      });

      this.seo.definirJsonLd({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: produto.name,
        description: descricao,
        image: imagem ? [imagem] : undefined,
        sku: produto.id,
        offers: {
          '@type': 'Offer',
          url: `${environment.siteUrl}${path}`,
          priceCurrency: 'BRL',
          price: (produto.priceCents / 100).toFixed(2),
          availability:
            produto.quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
        },
      });
    });
  }

  private readonly fotoSelecionadaId = signal<string | null>(null);

  protected readonly fotoAtual = computed<string | null>(() => {
    const fotos = this.produto()?.photos ?? [];
    if (fotos.length === 0) {
      return null;
    }
    const selecionada = fotos.find((f) => f.id === this.fotoSelecionadaId());
    return (selecionada ?? fotos.find((f) => f.isFavorite) ?? fotos[0]).url;
  });

  selecionarFoto(photoId: string): void {
    this.fotoSelecionadaId.set(photoId);
  }

  protected readonly avisoEstoque = computed<AvisoEstoque | null>(() => {
    const estoque = this.produto()?.quantity;
    if (estoque === 1) {
      return { texto: 'Resta apenas 1 item', nivel: 'critico' };
    }
    if (estoque === 2 || estoque === 3) {
      return { texto: `Restam ${estoque} itens`, nivel: 'baixo' };
    }
    return null;
  });

  atualizarQuantidade(valor: number, input: HTMLInputElement): void {
    const estoque = this.produto()?.quantity ?? 1;
    const clamped = valor > estoque ? estoque : Math.max(1, Math.trunc(valor) || 1);

    this.erroQuantidade.set(valor > estoque ? `Quantidade máxima disponível: ${estoque}.` : null);
    this.quantidade.set(clamped);
    // input nativo pode ficar com o texto digitado fora de sincronia com o
    // signal quando o valor clampado e igual ao valor anterior (ex: ja
    // estava em 1, digitou 5, volta pra 1) -- signal.set() com o mesmo
    // valor nao dispara re-render, entao o DOM precisa ser corrigido aqui.
    input.value = String(clamped);
  }

  adicionarAoCarrinho(): void {
    const produto = this.produto();
    if (!produto) {
      return;
    }

    if (this.quantidade() > produto.quantity) {
      this.erroQuantidade.set(`Quantidade máxima disponível: ${produto.quantity}.`);
      return;
    }

    this.carrinho.adicionar({
      productId: produto.id,
      name: produto.name,
      photoUrl: fotoCapa(produto),
      priceCents: produto.priceCents,
      isPresale: produto.isPresale,
      presaleDepositAmountCents: produto.presaleDepositAmountCents,
      quantity: this.quantidade(),
      stockQuantity: produto.quantity,
    });

    this.adicionado.set(true);
  }
}
