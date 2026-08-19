import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PedidoService } from '../../services/pedido-service';
import { Order } from '../../models/order';
import { PedidoDetalhe } from '../../../../shared/components/pedido-detalhe/pedido-detalhe';

type Passo = 'dados' | 'chave';

@Component({
  selector: 'app-consulta',
  imports: [FormsModule, PedidoDetalhe],
  templateUrl: './consulta.html',
  styleUrl: './consulta.scss',
})
export class Consulta {
  private readonly pedidoService = inject(PedidoService);

  protected readonly passo = signal<Passo>('dados');

  protected readonly orderId = signal('');
  protected readonly email = signal('');
  protected readonly chaveValidacao = signal('');

  protected readonly resultado = signal<Order | null>(null);
  protected readonly erro = signal(false);
  protected readonly carregando = signal(false);

  solicitarChave(): void {
    this.erro.set(false);
    this.carregando.set(true);

    this.pedidoService
      .solicitarChave({
        orderId: this.orderId().trim(),
        email: this.email().trim(),
      })
      .subscribe({
        next: () => {
          this.passo.set('chave');
          this.carregando.set(false);
        },
        error: () => {
          // erro aqui e sempre de validacao/rede -- a resposta de sucesso ja
          // e generica (o back-end nao revela se orderId+e-mail existem).
          this.erro.set(true);
          this.carregando.set(false);
        },
      });
  }

  consultar(): void {
    this.erro.set(false);
    this.resultado.set(null);
    this.carregando.set(true);

    this.pedidoService
      .consultar({
        orderId: this.orderId().trim(),
        email: this.email().trim(),
        chaveValidacao: this.chaveValidacao().trim(),
      })
      .subscribe({
        next: (order) => {
          this.resultado.set(order);
          this.carregando.set(false);
        },
        error: () => {
          this.erro.set(true);
          this.carregando.set(false);
        },
      });
  }

  voltar(): void {
    this.passo.set('dados');
    this.chaveValidacao.set('');
    this.erro.set(false);
    this.resultado.set(null);
  }
}
