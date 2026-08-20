import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { PixDiscountConfigService } from '../../../../../core/services/pix-discount-config';

@Component({
  selector: 'app-form',
  imports: [FormsModule],
  templateUrl: './form.html',
  styleUrl: './form.scss',
})
export class Form {
  private readonly pixDiscountConfigService = inject(PixDiscountConfigService);

  protected readonly enabled = signal(false);
  protected readonly percentage = signal<number | null>(null);

  protected readonly carregando = signal(true);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly sucesso = signal(false);

  constructor() {
    this.pixDiscountConfigService.obter().subscribe({
      next: (config) => {
        this.enabled.set(config.enabled);
        this.percentage.set(config.percentage);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar a configuração.');
        this.carregando.set(false);
      },
    });
  }

  salvar(): void {
    this.erro.set(null);
    this.sucesso.set(false);
    this.salvando.set(true);

    this.pixDiscountConfigService
      .atualizar({ enabled: this.enabled(), percentage: this.percentage() ?? 0 })
      .subscribe({
        next: () => {
          this.sucesso.set(true);
          this.salvando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.erro.set(err.error?.detail ?? 'Não foi possível salvar a configuração.');
          this.salvando.set(false);
        },
      });
  }
}
