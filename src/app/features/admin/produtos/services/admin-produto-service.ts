import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Product } from '../../../catalogo/models/product';

export interface ProductRequest {
  name: string;
  slug: string;
  description: string | null;
  priceCents: number;
  quantity: number;
  weightGrams: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  isPresale: boolean;
  presaleDepositAmountCents: number | null;
  isFeatured: boolean;
  isActive: boolean;
  tags: string[];
}

@Injectable({ providedIn: 'root' })
export class AdminProdutoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  listar(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/admin/produtos`);
  }

  buscarPorId(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/admin/produtos/${id}`);
  }

  criar(request: ProductRequest): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/admin/produtos`, request);
  }

  editar(id: string, request: ProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/admin/produtos/${id}`, request);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/produtos/${id}`);
  }

  adicionarFoto(id: string, file: File): Observable<Product> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Product>(`${this.baseUrl}/admin/produtos/${id}/fotos`, formData);
  }

  removerFoto(id: string, photoId: string): Observable<Product> {
    return this.http.delete<Product>(`${this.baseUrl}/admin/produtos/${id}/fotos/${photoId}`);
  }

  marcarFavorita(id: string, photoId: string): Observable<Product> {
    return this.http.put<Product>(
      `${this.baseUrl}/admin/produtos/${id}/fotos/${photoId}/favorita`,
      {},
    );
  }
}
