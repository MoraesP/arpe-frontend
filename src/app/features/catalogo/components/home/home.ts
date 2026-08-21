import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProdutoService } from '../../services/produto-service';
import { Seo } from '../../../../core/services/seo';
import { ProdutoCard } from '../../../../shared/components/produto-card/produto-card';

@Component({
  selector: 'app-home',
  imports: [ProdutoCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly produtoService = inject(ProdutoService);
  private readonly seo = inject(Seo);

  protected readonly destaques = toSignal(this.produtoService.destaque(), { initialValue: [] });

  constructor() {
    this.seo.atualizar({
      title: 'Colecionáveis Diecast — Hot Wheels e Miniaturas',
      description:
        'Loja de itens colecionáveis diecast: Hot Wheels, miniaturas 1:64 e 1:18 e itens de pré-venda. Retirada em Maringá/PR ou envio pelos Correios.',
      path: '/',
      type: 'website',
    });
  }
}
