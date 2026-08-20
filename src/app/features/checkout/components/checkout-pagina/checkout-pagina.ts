import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, debounceTime, interval, of, switchMap, take, takeWhile } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Carrinho } from '../../../../core/services/carrinho';
import { PixDiscountConfigService } from '../../../../core/services/pix-discount-config';
import { MoedaPipe } from '../../../../shared/pipes/moeda-pipe';
import { formatarCpfCnpj, isCpfCnpjValido } from '../../../../shared/utils/cpf-cnpj';
import { PedidoService } from '../../../pedido/services/pedido-service';
import { CheckoutService } from '../../services/checkout-service';
import {
  CheckoutConfirmarRequest,
  CheckoutPreferenciaRequest,
  PaymentMethod,
  ShippingMethod,
} from '../../models/checkout';

const STATUS_PAGO = new Set(['PAGO', 'PAGO_COMPLETO']);
const POLLING_INTERVALO_MS = 5000;
const POLLING_TIMEOUT_CARTAO_MS = 120000;

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
  private readonly pixDiscountConfigService = inject(PixDiscountConfigService);
  private readonly pedidoService = inject(PedidoService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly passo = signal<Passo>('dados');

  protected readonly nome = signal('');
  protected readonly email = signal('');
  protected readonly telefone = signal('');
  protected readonly documento = signal('');
  protected readonly documentoTocado = signal(false);
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
  protected readonly pixExpiraEm = signal<Date | null>(null);
  protected readonly pixExpirado = signal(false);
  protected readonly segundosRestantes = signal(0);
  protected readonly pagamentoConfirmado = signal(false);

  protected readonly brickCarregando = signal(false);
  protected readonly brickErro = signal<string | null>(null);

  protected readonly pixDiscountPercentage = signal<number | null>(null);

  private brickController: any = null;

  constructor() {
    this.pixDiscountConfigService.obter().subscribe({
      next: (config) => this.pixDiscountPercentage.set(config.enabled ? config.percentage : null),
      error: () => this.pixDiscountPercentage.set(null),
    });
  }

  private readonly request = computed<CheckoutPreferenciaRequest | null>(() => {
    const itens = this.carrinho.itens();
    if (
      itens.length === 0 ||
      !this.nome() ||
      !this.email() ||
      !this.telefone() ||
      !isCpfCnpjValido(this.documento())
    ) {
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
      comprador: {
        nome: this.nome(),
        email: this.email(),
        telefone: this.telefone(),
        document: this.documento(),
      },
      envio: {
        metodo: this.metodo(),
        enderecoEntrega: this.metodo() === 'CORREIOS' ? this.montarEnderecoEntrega() : null,
        cepDestino: this.metodo() === 'CORREIOS' ? this.cepDestino() : null,
        telefoneContato: this.metodo() === 'RETIRADA' ? this.telefone() : null,
      },
    };
  });

  protected readonly documentoInvalido = computed(
    () => this.documentoTocado() && this.documento().length > 0 && !isCpfCnpjValido(this.documento()),
  );

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

  /**
   * Calculado no frontend (mesma regra do backend, ver CheckoutService) pra
   * mostrar os dois totais lado a lado no resumo -- o Payment Brick nao tem
   * callback pra avisar qual metodo o comprador selecionou antes de
   * submeter, entao nao da pra reagir a essa escolha; em vez disso, os dois
   * valores ja ficam visiveis antes de escolher.
   */
  protected readonly totalComDescontoPixCents = computed<number | null>(() => {
    const totais = this.totais();
    const percentual = this.pixDiscountPercentage();
    if (!totais || percentual === null) {
      return null;
    }
    const base = totais.subtotalItensCents + totais.totalEntradaPreVendaCents;
    const descontoCents = Math.round((base * percentual) / 100);
    return totais.totalPagoCents - descontoCents;
  });

  onCepChange(valor: string): void {
    const digitos = valor.replace(/\D/g, '').slice(0, 8);
    const formatado = digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
    this.cepDestino.set(formatado);
  }

  onTelefoneChange(valor: string): void {
    const digitos = valor.replace(/\D/g, '').slice(0, 11);
    let formatado = digitos;
    if (digitos.length > 2) {
      formatado = `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
    }
    if (digitos.length > 7) {
      formatado = `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
    }
    this.telefone.set(formatado);
  }

  onDocumentoChange(valor: string): void {
    this.documento.set(formatarCpfCnpj(valor));
  }

  onDocumentoBlur(): void {
    this.documentoTocado.set(true);
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
        this.pixExpiraEm.set(response.pixExpiraEm ? new Date(response.pixExpiraEm) : null);
        this.iniciarAcompanhamentoPagamento(response.orderId, response.pixExpiraEm);
        resolve();
      },
      error: (err: HttpErrorResponse) => {
        this.erro.set(err.error?.detail ?? 'Não foi possível finalizar a compra. Tente novamente.');
        reject();
      },
    });
  }

  /**
   * Acompanha a confirmacao do pagamento sem reload -- Pix ganha cronometro
   * ate a expiracao do QR code (backend gera com 30min); cartao ganha um
   * timeout de seguranca menor (a aprovacao e quase instantanea, ver
   * PaymentWebhookService no backend). Para de fazer polling assim que o
   * status vira PAGO/PAGO_COMPLETO, expira, ou atinge o timeout.
   */
  private iniciarAcompanhamentoPagamento(orderId: string, pixExpiraEmIso: string | null): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const prazoMs = pixExpiraEmIso
      ? new Date(pixExpiraEmIso).getTime() - Date.now()
      : POLLING_TIMEOUT_CARTAO_MS;
    // conta em numero de ticks (nao em Date.now()) pra nao depender do
    // relogio de parede -- deixa o comportamento determinístico em teste
    // (fakeAsync) e imune a soneca do dispositivo/aba em segundo plano.
    const maxTicks = Math.max(1, Math.ceil(prazoMs / POLLING_INTERVALO_MS));

    if (pixExpiraEmIso) {
      this.segundosRestantes.set(Math.max(0, Math.round(prazoMs / 1000)));
    }

    interval(POLLING_INTERVALO_MS)
      .pipe(
        take(maxTicks),
        switchMap(() => this.pedidoService.statusPagamento(orderId)),
        // para de fazer polling assim que confirmar (inclusive: emite o
        // status confirmado antes de completar)
        takeWhile((status) => !STATUS_PAGO.has(status.status), true),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (status) => {
          if (pixExpiraEmIso) {
            this.segundosRestantes.update((s) => Math.max(0, s - POLLING_INTERVALO_MS / 1000));
          }
          if (STATUS_PAGO.has(status.status)) {
            this.pagamentoConfirmado.set(true);
          }
        },
        complete: () => {
          if (!this.pagamentoConfirmado() && pixExpiraEmIso) {
            this.pixExpirado.set(true);
          }
        },
      });
  }

  protected formatarTempo(): string {
    const total = this.segundosRestantes();
    const minutos = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');
    const segundos = (total % 60).toString().padStart(2, '0');
    return `${minutos}:${segundos}`;
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
