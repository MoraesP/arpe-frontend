import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { debounceTime, startWith, switchMap } from 'rxjs';
import { Seo } from '../../../../core/services/seo';
import { ProdutoCard } from '../../../../shared/components/produto-card/produto-card';
import { SkeletonCard } from '../../../../shared/components/skeleton-card/skeleton-card';
import { ProdutoService } from '../../services/produto-service';

@Component({
  selector: 'app-listagem',
  imports: [FormsModule, ProdutoCard, SkeletonCard],
  templateUrl: './listagem.html',
  styleUrl: './listagem.scss',
})
export class Listagem {
  private readonly produtoService = inject(ProdutoService);
  private readonly seo = inject(Seo);

  constructor() {
    // Filtros (busca/tag/ordenar) são estado só do signal, nunca refletidos
    // na URL -- o SSR sempre renderiza a listagem sem filtro nenhum, então
    // o título/descrição não têm por que variar por filtro (o crawler
    // nunca vê esse estado de qualquer forma).
    this.seo.atualizar({
      title: 'ArPe - Catálogo',
      description:
        'Veja todos os itens colecionáveis disponíveis: Hot Wheels, miniaturas e pré-vendas. Busque por nome ou filtre por marca/escala.',
      path: '/produtos',
      type: 'website',
    });
  }

  protected readonly busca = signal('');
  protected readonly tagSelecionada = signal('');
  protected readonly ordenar = signal<'asc' | 'desc'>('desc');

  protected readonly tags = toSignal(this.produtoService.tags(), { initialValue: [] });

  private readonly filtros = computed(() => ({
    busca: this.busca(),
    tag: this.tagSelecionada(),
    ordenar: this.ordenar(),
  }));

  protected readonly skeletonItems = [0, 1, 2];

  /**
   * null enquanto a busca esta em voo -- startWith(null) reseta pra
   * "carregando" a cada troca de filtro (novo switchMap), nao so na
   * primeira carga.
   */
  protected readonly produtos = toSignal(
    toObservable(this.filtros).pipe(
      debounceTime(250),
      switchMap((filtros) => this.produtoService.listar(filtros).pipe(startWith(null))),
    ),
    { initialValue: null },
  );
}
