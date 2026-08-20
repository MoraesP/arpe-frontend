import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PixDiscountConfig {
  enabled: boolean;
  percentage: number;
}

/**
 * Configuracao global (leitura publica, escrita restrita ao admin) do
 * desconto opcional no pagamento via Pix -- ver docs/specs/pagamento.md.
 */
@Injectable({ providedIn: 'root' })
export class PixDiscountConfigService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  obter(): Observable<PixDiscountConfig> {
    return this.http.get<PixDiscountConfig>(`${this.baseUrl}/config/desconto-pix`);
  }

  atualizar(config: PixDiscountConfig): Observable<PixDiscountConfig> {
    return this.http.put<PixDiscountConfig>(`${this.baseUrl}/admin/config/desconto-pix`, config);
  }
}
