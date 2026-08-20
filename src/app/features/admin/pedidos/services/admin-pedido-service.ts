import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Order, OrderStatus, OrderSummary } from '../../../pedido/models/order';

@Injectable({ providedIn: 'root' })
export class AdminPedidoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  listar(status?: OrderStatus | ''): Observable<OrderSummary[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<OrderSummary[]>(`${this.baseUrl}/admin/pedidos`, { params });
  }

  detalhe(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/admin/pedidos/${id}`);
  }

  retiradaAgendada(id: string): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/admin/pedidos/${id}/retirada-agendada`, {});
  }

  preparandoEnvio(id: string): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/admin/pedidos/${id}/preparando-envio`, {});
  }

  postar(id: string, trackingCode: string): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/admin/pedidos/${id}/postar`, { trackingCode });
  }

  concluir(id: string): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/admin/pedidos/${id}/concluir`, {});
  }

  cancelar(id: string): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/admin/pedidos/${id}/cancelar`, {});
  }
}
