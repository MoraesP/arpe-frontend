import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PedidoService } from '../../services/pedido-service';
import { Order } from '../../models/order';
import { PedidoDetalhe } from '../../../../shared/components/pedido-detalhe/pedido-detalhe';

@Component({
  selector: 'app-consulta',
  imports: [FormsModule, PedidoDetalhe],
  templateUrl: './consulta.html',
  styleUrl: './consulta.scss',
})
export class Consulta {
  private readonly pedidoService = inject(PedidoService);

  protected readonly orderId = signal('');
  protected readonly email = signal('');
  protected readonly chaveValidacao = signal('');

  protected readonly resultado = signal<Order | null>(null);
  protected readonly erro = signal(false);
  protected readonly carregando = signal(false);

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
}
