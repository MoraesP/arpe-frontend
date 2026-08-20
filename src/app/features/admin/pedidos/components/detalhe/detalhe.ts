import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  private readonly STATUS_PAGO = new Set(['PAGO', 'PAGO_COMPLETO']);

  /** Guia o botão de ação exibido, conforme status atual + shippingMethod. */
  proximaAcao(): 'agendar-retirada' | 'preparar-envio' | 'postar' | 'concluir' | null {
    const order = this.order();
    if (!order) {
      return null;
    }
    if (this.STATUS_PAGO.has(order.status)) {
      return order.shippingMethod === 'RETIRADA' ? 'agendar-retirada' : 'preparar-envio';
    }
    if (order.status === 'PREPARANDO_ENVIO') {
      return 'postar';
    }
    if (order.status === 'RETIRADA_AGENDADA' || order.status === 'ENVIADO') {
      return 'concluir';
    }
    return null;
  }

  podeCancelar(): boolean {
    const status = this.order()?.status;
    return status !== 'ENVIADO' && status !== 'CONCLUIDO' && status !== 'CANCELADO';
  }

  agendarRetirada(): void {
    this.executarAcao(this.adminPedidoService.retiradaAgendada(this.id), 'Retirada agendada.');
  }

  prepararEnvio(): void {
    this.executarAcao(this.adminPedidoService.preparandoEnvio(this.id), 'Pedido marcado como preparando envio.');
  }

  postar(): void {
    if (!this.trackingCode()) {
      return;
    }
    this.executarAcao(this.adminPedidoService.postar(this.id, this.trackingCode()), 'Pedido marcado como enviado.');
  }

  concluir(): void {
    this.executarAcao(this.adminPedidoService.concluir(this.id), 'Pedido concluído.');
  }

  private executarAcao(acao$: Observable<Order>, mensagemSucesso: string): void {
    this.processando.set(true);
    this.mensagem.set(null);

    acao$.subscribe({
      next: (order) => {
        this.order.set(order);
        this.mensagem.set(mensagemSucesso);
        this.processando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.mensagem.set(err.error?.detail ?? 'Não foi possível concluir a ação.');
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
