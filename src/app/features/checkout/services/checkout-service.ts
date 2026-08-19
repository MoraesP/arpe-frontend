import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CheckoutConfirmarRequest,
  CheckoutConfirmarResponse,
  CheckoutPreferenciaRequest,
  CheckoutPreferenciaResponse,
} from '../models/checkout';

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  preferencia(request: CheckoutPreferenciaRequest): Observable<CheckoutPreferenciaResponse> {
    return this.http.post<CheckoutPreferenciaResponse>(`${this.baseUrl}/checkout/preferencia`, request);
  }

  confirmar(request: CheckoutConfirmarRequest): Observable<CheckoutConfirmarResponse> {
    return this.http.post<CheckoutConfirmarResponse>(`${this.baseUrl}/checkout/confirmar`, request);
  }
}
