import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminAuthService } from '../../services/admin-auth-service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly adminAuthService = inject(AdminAuthService);
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly senha = signal('');
  protected readonly erro = signal(false);
  protected readonly carregando = signal(false);

  entrar(): void {
    this.erro.set(false);
    this.carregando.set(true);

    this.adminAuthService.login(this.email(), this.senha()).subscribe({
      next: () => {
        this.router.navigate(['/admin/dashboard']);
      },
      error: (_err: HttpErrorResponse) => {
        this.erro.set(true);
        this.carregando.set(false);
      },
    });
  }
}
