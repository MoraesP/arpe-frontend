import { Component, input } from '@angular/core';
import { Order, ORDER_STATUS_LABEL } from '../../../features/pedido/models/order';
import { MoedaPipe } from '../../pipes/moeda-pipe';

/** Reusado na consulta publica de pedido e no detalhe do admin. */
@Component({
  selector: 'app-pedido-detalhe',
  imports: [MoedaPipe],
  templateUrl: './pedido-detalhe.html',
  styleUrl: './pedido-detalhe.scss',
})
export class PedidoDetalhe {
  readonly order = input.required<Order>();
  protected readonly statusLabel = ORDER_STATUS_LABEL;
}
