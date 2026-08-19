import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AdminAuth } from '../../../../core/services/admin-auth';

interface LoginResponse {
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly http = inject(HttpClient);
  private readonly adminAuth = inject(AdminAuth);
  private readonly baseUrl = environment.apiBaseUrl;

  login(email: string, senha: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/admin/auth/login`, { email, senha })
      .pipe(tap((response) => this.adminAuth.setToken(response.token)));
  }
}
