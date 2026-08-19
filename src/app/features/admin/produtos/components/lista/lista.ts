import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminProdutoService } from '../../services/admin-produto-service';
import { Product } from '../../../../catalogo/models/product';
import { MoedaPipe } from '../../../../../shared/pipes/moeda-pipe';

@Component({
  selector: 'app-lista',
  imports: [RouterLink, MoedaPipe],
  templateUrl: './lista.html',
  styleUrl: './lista.scss',
})
export class Lista {
  private readonly adminProdutoService = inject(AdminProdutoService);

  protected readonly produtos = signal<Product[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);

  constructor() {
    this.carregar();
  }

  private carregar(): void {
    this.carregando.set(true);
    this.adminProdutoService.listar().subscribe({
      next: (produtos) => {
        this.produtos.set(produtos);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar os produtos.');
        this.carregando.set(false);
      },
    });
  }

  excluir(produto: Product): void {
    if (!confirm(`Excluir "${produto.name}"? Essa ação não pode ser desfeita.`)) {
      return;
    }

    this.adminProdutoService.excluir(produto.id).subscribe({
      next: () => this.produtos.update((lista) => lista.filter((p) => p.id !== produto.id)),
      error: (err: HttpErrorResponse) => {
        alert(err.error?.detail ?? 'Não foi possível excluir o produto.');
      },
    });
  }
}
