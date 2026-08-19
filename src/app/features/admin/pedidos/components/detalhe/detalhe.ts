import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminPedidoService } from '../../services/admin-pedido-service';
import { Order } from '../../../../pedido/models/order';
import { PedidoDetalhe } from '../../../../../shared/components/pedido-detalhe/pedido-detalhe';

@Component({
  selector: 'app-detalhe',
  imports: [FormsModule, RouterLink, PedidoDetalhe],
  templateUrl: './detalhe.html',
  styleUrl: './detalhe.scss',
})
export class Detalhe {
  private readonly route = inject(ActivatedRoute);
  private readonly adminPedidoService = inject(AdminPedidoService);

  private readonly id = this.route.snapshot.paramMap.get('id')!;

  protected readonly order = signal<Order | null>(null);
  protected readonly carregando = signal(true);
  protected readonly trackingCode = signal('');
  protected readonly processando = signal(false);
  protected readonly mensagem = signal<string | null>(null);

  constructor() {
    this.carregar();
  }

  private carregar(): void {
    this.carregando.set(true);
    this.adminPedidoService.detalhe(this.id).subscribe({
      next: (order) => {
        this.order.set(order);
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false),
    });
  }

  podeAgir(): boolean {
    const status = this.order()?.status;
    return status !== 'ENVIADO' && status !== 'CANCELADO';
  }

  postar(): void {
    if (!this.trackingCode()) {
      return;
    }
    this.processando.set(true);
    this.mensagem.set(null);

    this.adminPedidoService.postar(this.id, this.trackingCode()).subscribe({
      next: (order) => {
        this.order.set(order);
        this.mensagem.set('Pedido marcado como enviado.');
        this.processando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.mensagem.set(err.error?.detail ?? 'Não foi possível postar o pedido.');
        this.processando.set(false);
      },
    });
  }

  cancelar(): void {
    if (!confirm('Cancelar este pedido? O estoque será restaurado e o cliente será avisado.')) {
      return;
    }
    this.processando.set(true);
    this.mensagem.set(null);

    this.adminPedidoService.cancelar(this.id).subscribe({
      next: (order) => {
        this.order.set(order);
        this.mensagem.set('Pedido cancelado.');
        this.processando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.mensagem.set(err.error?.detail ?? 'Não foi possível cancelar o pedido.');
        this.processando.set(false);
      },
    });
  }
}
