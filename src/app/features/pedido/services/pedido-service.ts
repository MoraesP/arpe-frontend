import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Order } from '../models/order';

export interface ConsultarPedidoRequest {
  orderId: string;
  email: string;
  chaveValidacao: string;
}

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  consultar(request: ConsultarPedidoRequest): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/pedidos/consultar`, request);
  }
}
