import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DashboardService } from '../../services/dashboard-service';
import { MoedaPipe } from '../../../../../shared/pipes/moeda-pipe';
import { ORDER_STATUS_LABEL, OrderStatus } from '../../../../pedido/models/order';

@Component({
  selector: 'app-dashboard',
  imports: [MoedaPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly dashboardService = inject(DashboardService);

  protected readonly metricas = toSignal(this.dashboardService.obterMetricas(), { initialValue: null });
  protected readonly statusLabel = ORDER_STATUS_LABEL;

  protected statusEntries(pedidosPorStatus: Partial<Record<OrderStatus, number>>) {
    return Object.entries(pedidosPorStatus) as [OrderStatus, number][];
  }

  protected totalPedidos(pedidosPorStatus: Partial<Record<OrderStatus, number>>): number {
    return Object.values(pedidosPorStatus).reduce((total, qtd) => total + (qtd ?? 0), 0);
  }
}
