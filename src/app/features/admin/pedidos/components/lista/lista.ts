import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { switchMap } from 'rxjs';
import { AdminPedidoService } from '../../services/admin-pedido-service';
import { MoedaPipe } from '../../../../../shared/pipes/moeda-pipe';
import { ORDER_STATUS_LABEL, OrderStatus } from '../../../../pedido/models/order';

@Component({
  selector: 'app-lista',
  imports: [FormsModule, RouterLink, DatePipe, MoedaPipe],
  templateUrl: './lista.html',
  styleUrl: './lista.scss',
})
export class Lista {
  private readonly adminPedidoService = inject(AdminPedidoService);

  protected readonly statusFiltro = signal<OrderStatus | ''>('');
  protected readonly statusLabel = ORDER_STATUS_LABEL;
  protected readonly statusOptions = Object.keys(ORDER_STATUS_LABEL) as OrderStatus[];

  protected readonly pedidos = toSignal(
    toObservable(this.statusFiltro).pipe(switchMap((status) => this.adminPedidoService.listar(status))),
    { initialValue: [] },
  );
}
