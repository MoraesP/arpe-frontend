import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { OrderStatus } from '../../../pedido/models/order';

export interface ProdutoMaisVendido {
  productId: string;
  productName: string;
  quantidadeVendida: number;
}

export interface DashboardResponse {
  totalVendidoCents: number;
  pedidosPorStatus: Partial<Record<OrderStatus, number>>;
  produtosMaisVendidos: ProdutoMaisVendido[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  obterMetricas(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.baseUrl}/admin/dashboard`);
  }
}
