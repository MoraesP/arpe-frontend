import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Order, OrderStatus } from '../models/order';

export interface SolicitarChaveRequest {
  orderId: string;
  email: string;
}

export interface ConsultarPedidoRequest {
  orderId: string;
  email: string;
  chaveValidacao: string;
}

export interface StatusPagamentoResponse {
  status: OrderStatus;
}

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  solicitarChave(request: SolicitarChaveRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/pedidos/solicitar-chave`, request);
  }

  consultar(request: ConsultarPedidoRequest): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/pedidos/consultar`, request);
  }

  statusPagamento(orderId: string): Observable<StatusPagamentoResponse> {
    return this.http.get<StatusPagamentoResponse>(`${this.baseUrl}/pedidos/${orderId}/status-pagamento`);
  }
}
