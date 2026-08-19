import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminPreVendaService } from '../../services/admin-pre-venda-service';
import { Product } from '../../../../catalogo/models/product';
import { MoedaPipe } from '../../../../../shared/pipes/moeda-pipe';

@Component({
  selector: 'app-lista',
  imports: [MoedaPipe],
  templateUrl: './lista.html',
  styleUrl: './lista.scss',
})
export class Lista {
  private readonly adminPreVendaService = inject(AdminPreVendaService);

  protected readonly produtos = signal<Product[]>([]);
  protected readonly selecionados = signal<Set<string>>(new Set());
  protected readonly carregando = signal(true);
  protected readonly liberando = signal(false);
  protected readonly mensagem = signal<string | null>(null);

  constructor() {
    this.carregar();
  }

  private carregar(): void {
    this.carregando.set(true);
    this.adminPreVendaService.listarPendentes().subscribe({
      next: (produtos) => {
        this.produtos.set(produtos);
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false),
    });
  }

  alternar(productId: string): void {
    this.selecionados.update((set) => {
      const novo = new Set(set);
      novo.has(productId) ? novo.delete(productId) : novo.add(productId);
      return novo;
    });
  }

  liberarSelecionados(): void {
    const ids = Array.from(this.selecionados());
    if (ids.length === 0) {
      return;
    }

    this.liberando.set(true);
    this.mensagem.set(null);

    this.adminPreVendaService.liberar(ids).subscribe({
      next: () => {
        this.mensagem.set(`${ids.length} produto(s) liberado(s) com sucesso.`);
        this.selecionados.set(new Set());
        this.liberando.set(false);
        this.carregar();
      },
      error: (err: HttpErrorResponse) => {
        this.mensagem.set(err.error?.detail ?? 'Não foi possível liberar os produtos.');
        this.liberando.set(false);
      },
    });
  }
}
