import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Product, Tag } from '../models/product';

/** Consome os endpoints publicos de catalogo -- ver docs/specs/catalogo.md. */
@Injectable({ providedIn: 'root' })
export class ProdutoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  destaque(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/produtos/destaque`);
  }

  listar(filtros: { busca?: string; tag?: string; ordenar?: string } = {}): Observable<Product[]> {
    let params = new HttpParams();
    if (filtros.busca) params = params.set('busca', filtros.busca);
    if (filtros.tag) params = params.set('tag', filtros.tag);
    if (filtros.ordenar) params = params.set('ordenar', filtros.ordenar);
    return this.http.get<Product[]>(`${this.baseUrl}/produtos`, { params });
  }

  detalhe(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/produtos/${id}`);
  }

  tags(): Observable<Tag[]> {
    return this.http.get<Tag[]>(`${this.baseUrl}/tags`);
  }
}
