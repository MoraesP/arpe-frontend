import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminAuth } from '../../../core/services/admin-auth';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.scss',
})
export class AdminShell {
  private readonly adminAuth = inject(AdminAuth);
  private readonly router = inject(Router);

  sair(): void {
    this.adminAuth.clearToken();
    this.router.navigate(['/admin/auth/login']);
  }
}
