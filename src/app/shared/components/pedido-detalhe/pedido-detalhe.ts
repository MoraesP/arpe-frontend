import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { Order, ORDER_STATUS_LABEL, OrderStatus } from '../../../features/pedido/models/order';
import { MoedaPipe } from '../../pipes/moeda-pipe';

// saldoPreVendaCents é a mesma soma (remainingAmountCents dos itens) antes e
// depois de pago -- o que muda é só o status do pedido, então a exibição
// (pendente vs já pago) é decidida por essas duas listas de status.
const STATUS_SALDO_PENDENTE = new Set<OrderStatus>(['AGUARDANDO_LIBERACAO_PRE_VENDA', 'AGUARDANDO_PAGAMENTO_SALDO']);
const STATUS_SALDO_PAGO = new Set<OrderStatus>([
  'PAGO_COMPLETO',
  'RETIRADA_AGENDADA',
  'PREPARANDO_ENVIO',
  'ENVIADO',
  'CONCLUIDO',
]);

/** Reusado na consulta publica de pedido e no detalhe do admin. */
@Component({
  selector: 'app-pedido-detalhe',
  imports: [MoedaPipe, DatePipe],
  templateUrl: './pedido-detalhe.html',
  styleUrl: './pedido-detalhe.scss',
})
export class PedidoDetalhe {
  readonly order = input.required<Order>();
  protected readonly statusLabel = ORDER_STATUS_LABEL;

  protected readonly saldoPendente = computed(
    () => this.order().saldoPreVendaCents > 0 && STATUS_SALDO_PENDENTE.has(this.order().status),
  );

  protected readonly saldoPago = computed(
    () => this.order().saldoPreVendaCents > 0 && STATUS_SALDO_PAGO.has(this.order().status),
  );
}
