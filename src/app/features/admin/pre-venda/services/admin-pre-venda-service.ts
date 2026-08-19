import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Product } from '../../../catalogo/models/product';

@Injectable({ providedIn: 'root' })
export class AdminPreVendaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  listarPendentes(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/admin/pre-venda`);
  }

  liberar(productIds: string[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/admin/pre-venda/liberar`, { productIds });
  }
}
