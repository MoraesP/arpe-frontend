import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, debounceTime, of, switchMap } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Carrinho } from '../../../../core/services/carrinho';
import { MoedaPipe } from '../../../../shared/pipes/moeda-pipe';
import { CheckoutService } from '../../services/checkout-service';
import {
  CheckoutConfirmarRequest,
  CheckoutPreferenciaRequest,
  PaymentMethod,
  ShippingMethod,
} from '../../models/checkout';

declare const MercadoPago: any;

type Passo = 'dados' | 'pagamento';

const SDK_URL = 'https://sdk.mercadopago.com/js/v2';
const BRICK_CONTAINER_ID = 'paymentBrick_container';

const ESTADOS_BRASIL: { sigla: string; nome: string }[] = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
];

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
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly passo = signal<Passo>('dados');

  protected readonly nome = signal('');
  protected readonly email = signal('');
  protected readonly telefone = signal('');
  protected readonly metodo = signal<ShippingMethod>('RETIRADA');
  protected readonly cepDestino = signal('');
  protected readonly logradouro = signal('');
  protected readonly numero = signal('');
  protected readonly complemento = signal('');
  protected readonly estado = signal('');
  protected readonly cidade = signal('');

  protected readonly estados = ESTADOS_BRASIL;

  protected readonly enviando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly pedidoConfirmado = signal<string | null>(null);
  protected readonly pixQrCode = signal<string | null>(null);
  protected readonly pixQrCodeBase64 = signal<string | null>(null);
  protected readonly pixCopiado = signal(false);

  protected readonly brickCarregando = signal(false);
  protected readonly brickErro = signal<string | null>(null);

  private brickController: any = null;

  private readonly request = computed<CheckoutPreferenciaRequest | null>(() => {
    const itens = this.carrinho.itens();
    if (itens.length === 0 || !this.nome() || !this.email()) {
      return null;
    }
    if (this.metodo() === 'RETIRADA' && !this.telefone()) {
      return null;
    }
    if (
      this.metodo() === 'CORREIOS' &&
      (!this.cepDestino() ||
        !this.logradouro() ||
        !this.numero() ||
        !this.estado() ||
        !this.cidade())
    ) {
      return null;
    }

    return {
      itens: itens.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      comprador: { nome: this.nome(), email: this.email(), telefone: this.telefone() || null },
      envio: {
        metodo: this.metodo(),
        enderecoEntrega: this.metodo() === 'CORREIOS' ? this.montarEnderecoEntrega() : null,
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

  onCepChange(valor: string): void {
    const digitos = valor.replace(/\D/g, '').slice(0, 8);
    const formatado = digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
    this.cepDestino.set(formatado);
  }

  private montarEnderecoEntrega(): string {
    const complemento = this.complemento() ? `, ${this.complemento()}` : '';
    return `${this.logradouro()}, ${this.numero()}${complemento} - ${this.cidade()}/${this.estado()}`;
  }

  irParaPagamento(): void {
    if (!this.totais()) {
      return;
    }
    this.passo.set('pagamento');
    // adia pro proximo ciclo -- o container do Brick so existe no DOM
    // depois do Angular renderizar a mudanca de passo() acima
    setTimeout(() => this.inicializarBrick(), 0);
  }

  voltarParaDados(): void {
    this.desmontarBrick();
    this.passo.set('dados');
  }

  irParaConsulta(): void {
    this.router.navigate(['/pedido']);
  }

  copiarCodigoPix(): void {
    const codigo = this.pixQrCode();
    if (!codigo || !isPlatformBrowser(this.platformId)) {
      return;
    }
    navigator.clipboard.writeText(codigo).then(() => {
      this.pixCopiado.set(true);
      setTimeout(() => this.pixCopiado.set(false), 3000);
    });
  }

  private async inicializarBrick(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const totais = this.totais();
    if (!totais) {
      return;
    }

    this.brickErro.set(null);
    this.brickCarregando.set(true);

    try {
      await this.carregarSdk();
      const mp = new MercadoPago(environment.mercadoPagoPublicKey, { locale: 'pt-BR' });
      const bricksBuilder = mp.bricks();

      this.brickController = await bricksBuilder.create('payment', BRICK_CONTAINER_ID, {
        initialization: {
          amount: totais.totalPagoCents / 100,
          payer: { email: this.email() },
        },
        customization: {
          paymentMethods: {
            creditCard: 'all',
            bankTransfer: 'all', // Pix
          },
        },
        callbacks: {
          onReady: () => this.brickCarregando.set(false),
          onError: (error: any) => {
            console.error('Erro no Payment Brick', error);
            // "non_critical" acontece durante a digitação normal (ex: BIN do
            // cartao ainda incompleto) -- so trata como falha real o resto
            this.brickCarregando.set(false);
            if (error?.type !== 'non_critical') {
              this.brickErro.set(
                'Não foi possível carregar o formulário de pagamento. Tente novamente.',
              );
            }
          },
          onSubmit: ({ formData }: any) =>
            new Promise<void>((resolve, reject) =>
              this.confirmarComBrick(formData, resolve, reject),
            ),
        },
      });
    } catch (err) {
      console.error('Falha ao inicializar o Payment Brick', err);
      this.brickErro.set('Não foi possível carregar o formulário de pagamento. Tente novamente.');
      this.brickCarregando.set(false);
    }
  }

  private desmontarBrick(): void {
    this.brickController?.unmount();
    this.brickController = null;
  }

  private confirmarComBrick(formData: any, resolve: () => void, reject: () => void): void {
    const request = this.request();
    if (!request) {
      reject();
      return;
    }

    this.erro.set(null);

    const metodoPagamento: PaymentMethod = formData.payment_method_id === 'pix' ? 'PIX' : 'CARTAO';
    const body: CheckoutConfirmarRequest = {
      ...request,
      cardToken: formData.token ?? null,
      paymentMethodId: formData.payment_method_id,
      installments: formData.installments ?? null,
      issuerId: formData.issuer_id ?? null,
      metodoPagamento,
    };

    this.checkoutService.confirmar(body).subscribe({
      next: (response) => {
        this.carrinho.limpar();
        this.pixQrCode.set(response.pixQrCode);
        this.pixQrCodeBase64.set(response.pixQrCodeBase64);
        this.pedidoConfirmado.set(response.orderId);
        resolve();
      },
      error: (err: HttpErrorResponse) => {
        this.erro.set(err.error?.detail ?? 'Não foi possível finalizar a compra. Tente novamente.');
        reject();
      },
    });
  }

  private carregarSdk(): Promise<void> {
    if (typeof MercadoPago !== 'undefined') {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SDK_URL;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Falha ao carregar SDK do Mercado Pago'));
      document.head.appendChild(script);
    });
  }
}
