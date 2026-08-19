import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, debounceTime, of, switchMap } from 'rxjs';
import { Carrinho } from '../../../../core/services/carrinho';
import { MoedaPipe } from '../../../../shared/pipes/moeda-pipe';
import { CheckoutService } from '../../services/checkout-service';
import { CheckoutPreferenciaRequest, PaymentMethod, ShippingMethod } from '../../models/checkout';

@Component({
  selector: 'app-checkout-pagina',
  imports: [FormsModule, RouterLink, MoedaPipe],
  templateUrl: './checkout-pagina.html',
  styleUrl: './checkout-pagina.scss',
})
export class CheckoutPagina {
  protected readonly carrinho = inject(Carrinho);
  private readonly checkoutService = inject(CheckoutService);
  private readonly router = inject(Router);

  protected readonly nome = signal('');
  protected readonly email = signal('');
  protected readonly telefone = signal('');
  protected readonly metodo = signal<ShippingMethod>('RETIRADA');
  protected readonly enderecoEntrega = signal('');
  protected readonly cepDestino = signal('');
  protected readonly metodoPagamento = signal<PaymentMethod>('PIX');

  protected readonly enviando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly pedidoConfirmado = signal<string | null>(null);

  private readonly request = computed<CheckoutPreferenciaRequest | null>(() => {
    const itens = this.carrinho.itens();
    if (itens.length === 0 || !this.nome() || !this.email()) {
      return null;
    }
    if (this.metodo() === 'RETIRADA' && !this.telefone()) {
      return null;
    }
    if (this.metodo() === 'CORREIOS' && (!this.enderecoEntrega() || !this.cepDestino())) {
      return null;
    }

    return {
      itens: itens.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      comprador: { nome: this.nome(), email: this.email(), telefone: this.telefone() || null },
      envio: {
        metodo: this.metodo(),
        enderecoEntrega: this.metodo() === 'CORREIOS' ? this.enderecoEntrega() : null,
        cepDestino: this.metodo() === 'CORREIOS' ? this.cepDestino() : null,
        telefoneContato: this.metodo() === 'RETIRADA' ? this.telefone() : null,
      },
    };
  });

  protected readonly preferenciaErro = signal<string | null>(null);

  protected readonly preferencia = toObservable(this.request).pipe(
    debounceTime(400),
    switchMap((request) => {
      this.preferenciaErro.set(null);
      if (!request) {
        return of(null);
      }
      return this.checkoutService.preferencia(request).pipe(
        catchError((err: HttpErrorResponse) => {
          this.preferenciaErro.set(err.error?.detail ?? 'Não foi possível calcular o total agora.');
          return of(null);
        }),
      );
    }),
  );

  protected readonly totais = toSignal(this.preferencia, { initialValue: null });

  confirmar(): void {
    const request = this.request();
    if (!request) {
      return;
    }

    this.erro.set(null);
    this.enviando.set(true);

    this.checkoutService
      .confirmar({ ...request, cardToken: 'dev-placeholder-token', metodoPagamento: this.metodoPagamento() })
      .subscribe({
        next: (response) => {
          this.pedidoConfirmado.set(response.orderId);
          this.carrinho.limpar();
          this.enviando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.erro.set(err.error?.detail ?? 'Não foi possível finalizar a compra. Tente novamente.');
          this.enviando.set(false);
        },
      });
  }

  irParaConsulta(): void {
    this.router.navigate(['/pedido']);
  }
}
