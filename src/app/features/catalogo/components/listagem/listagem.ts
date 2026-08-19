import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { debounceTime, switchMap } from 'rxjs';
import { ProdutoCard } from '../../../../shared/components/produto-card/produto-card';
import { ProdutoService } from '../../services/produto-service';

@Component({
  selector: 'app-listagem',
  imports: [FormsModule, ProdutoCard],
  templateUrl: './listagem.html',
  styleUrl: './listagem.scss',
})
export class Listagem {
  private readonly produtoService = inject(ProdutoService);

  protected readonly busca = signal('');
  protected readonly tagSelecionada = signal('');
  protected readonly ordenar = signal<'asc' | 'desc'>('desc');

  protected readonly tags = toSignal(this.produtoService.tags(), { initialValue: [] });

  private readonly filtros = computed(() => ({
    busca: this.busca(),
    tag: this.tagSelecionada(),
    ordenar: this.ordenar(),
  }));

  protected readonly produtos = toSignal(
    toObservable(this.filtros).pipe(
      debounceTime(250),
      switchMap((filtros) => this.produtoService.listar(filtros)),
    ),
    { initialValue: [] },
  );
}
