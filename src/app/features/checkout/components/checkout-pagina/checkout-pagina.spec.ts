import { TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { CheckoutPagina } from './checkout-pagina';
import { CheckoutService } from '../../services/checkout-service';
import { PedidoService } from '../../../pedido/services/pedido-service';
import { Carrinho } from '../../../../core/services/carrinho';
import { PixDiscountConfigService } from '../../../../core/services/pix-discount-config';
import { CartItem } from '../../../carrinho/models/cart-item';
import { CheckoutPreferenciaResponse, CheckoutConfirmarResponse } from '../../models/checkout';

function criarItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: 'p1',
    name: 'Ferrari F40',
    photoUrl: null,
    priceCents: 10000,
    isPresale: false,
    presaleDepositAmountCents: null,
    quantity: 1,
    stockQuantity: 10,
    ...overrides,
  };
}

const totaisFake: CheckoutPreferenciaResponse = {
  subtotalItensCents: 10000,
  totalEntradaPreVendaCents: 0,
  shippingCostCents: 0,
  totalPagoCents: 10000,
  temPreVenda: false,
};

describe('CheckoutPagina', () => {
  let checkoutService: jasmine.SpyObj<CheckoutService>;
  let pedidoService: jasmine.SpyObj<PedidoService>;
  let carrinho: Carrinho;

  beforeEach(() => {
    localStorage.clear();
    // stub, não delete: o componente agora carrega o SDK assim que a
    // página monta (não só ao ir pro passo de pagamento) -- sem isso aqui,
    // testes fora do describe de Brick tentariam injetar o <script> real
    // do SDK e fazer uma requisição de rede de verdade. Os testes que
    // precisam do Brick de fato sobrescrevem isso no próprio beforeEach.
    (window as any).MercadoPago = function () {
      return { bricks: () => ({ create: () => Promise.resolve({ unmount: () => {} }) }) };
    };

    checkoutService = jasmine.createSpyObj<CheckoutService>('CheckoutService', [
      'preferencia',
      'confirmar',
    ]);
    checkoutService.preferencia.and.returnValue(of(totaisFake));

    pedidoService = jasmine.createSpyObj<PedidoService>('PedidoService', ['statusPagamento']);
    pedidoService.statusPagamento.and.returnValue(of({ status: 'AGUARDANDO_PAGAMENTO' }));

    const pixDiscountConfigService = jasmine.createSpyObj<PixDiscountConfigService>('PixDiscountConfigService', [
      'obter',
    ]);
    pixDiscountConfigService.obter.and.returnValue(of({ enabled: false, percentage: 0 }));

    TestBed.configureTestingModule({
      imports: [CheckoutPagina],
      providers: [
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: CheckoutService, useValue: checkoutService },
        { provide: PedidoService, useValue: pedidoService },
        { provide: PixDiscountConfigService, useValue: pixDiscountConfigService },
      ],
    });

    carrinho = TestBed.inject(Carrinho);
  });

  function criarFixture() {
    const fixture = TestBed.createComponent(CheckoutPagina);
    fixture.detectChanges();
    return fixture;
  }

  function preencherDadosRetirada(fixture: ReturnType<typeof criarFixture>) {
    fixture.componentInstance['nome'].set('Fulano');
    fixture.componentInstance['email'].set('fulano@teste.com');
    fixture.componentInstance['metodo'].set('RETIRADA');
    fixture.componentInstance['telefone'].set('44999998888');
    fixture.componentInstance['documento'].set('111.444.777-35');
  }

  it('não consulta a preferência de checkout enquanto o carrinho estiver vazio', fakeAsync(() => {
    const fixture = criarFixture();
    tick(400);

    expect(checkoutService.preferencia).not.toHaveBeenCalled();
    expect(fixture.componentInstance['totais']()).toBeNull();
  }));

  it('não consulta a preferência sem telefone (obrigatório pra qualquer método)', fakeAsync(() => {
    const fixture = criarFixture();
    carrinho.adicionar(criarItem());
    fixture.componentInstance['nome'].set('Fulano');
    fixture.componentInstance['email'].set('fulano@teste.com');
    fixture.componentInstance['documento'].set('111.444.777-35');
    fixture.detectChanges();
    tick(400);

    expect(checkoutService.preferencia).not.toHaveBeenCalled();
  }));

  it('não consulta a preferência sem CPF/CNPJ válido (obrigatório pra qualquer método)', fakeAsync(() => {
    const fixture = criarFixture();
    carrinho.adicionar(criarItem());
    fixture.componentInstance['nome'].set('Fulano');
    fixture.componentInstance['email'].set('fulano@teste.com');
    fixture.componentInstance['telefone'].set('44999998888');
    fixture.componentInstance['documento'].set('111.111.111-11'); // digito verificador invalido
    fixture.detectChanges();
    tick(400);

    expect(checkoutService.preferencia).not.toHaveBeenCalled();
  }));

  it('não consulta a preferência sem endereço/CEP quando o método é Correios', fakeAsync(() => {
    const fixture = criarFixture();
    carrinho.adicionar(criarItem());
    fixture.componentInstance['nome'].set('Fulano');
    fixture.componentInstance['email'].set('fulano@teste.com');
    fixture.componentInstance['metodo'].set('CORREIOS');
    fixture.detectChanges();
    tick(400);

    expect(checkoutService.preferencia).not.toHaveBeenCalled();
  }));

  it('não consulta a preferência sem estado/cidade quando o método é Correios', fakeAsync(() => {
    const fixture = criarFixture();
    carrinho.adicionar(criarItem());
    fixture.componentInstance['nome'].set('Fulano');
    fixture.componentInstance['email'].set('fulano@teste.com');
    fixture.componentInstance['metodo'].set('CORREIOS');
    fixture.componentInstance['cepDestino'].set('87010-000');
    fixture.componentInstance['logradouro'].set('Rua das Flores');
    fixture.componentInstance['numero'].set('123');
    fixture.detectChanges();
    tick(400);

    expect(checkoutService.preferencia).not.toHaveBeenCalled();
  }));

  it('onTelefoneChange() aplica a máscara (xx) xxxxx-xxxx conforme o usuário digita', () => {
    const fixture = criarFixture();

    fixture.componentInstance.onTelefoneChange('44');
    expect(fixture.componentInstance['telefone']()).toBe('44');

    fixture.componentInstance.onTelefoneChange('4499999');
    expect(fixture.componentInstance['telefone']()).toBe('(44) 99999');

    fixture.componentInstance.onTelefoneChange('44999998888');
    expect(fixture.componentInstance['telefone']()).toBe('(44) 99999-8888');
  });

  it('onDocumentoChange() aplica a máscara de CPF/CNPJ conforme os dígitos', () => {
    const fixture = criarFixture();

    fixture.componentInstance.onDocumentoChange('11144477735');
    expect(fixture.componentInstance['documento']()).toBe('111.444.777-35');

    fixture.componentInstance.onDocumentoChange('11222333000181');
    expect(fixture.componentInstance['documento']()).toBe('11.222.333/0001-81');
  });

  it('documentoInvalido() só acusa erro depois do campo perder foco (blur)', () => {
    const fixture = criarFixture();
    fixture.componentInstance.onDocumentoChange('11111111111'); // digito verificador invalido

    expect(fixture.componentInstance['documentoInvalido']()).toBe(false);

    fixture.componentInstance.onDocumentoBlur();

    expect(fixture.componentInstance['documentoInvalido']()).toBe(true);
  });

  it('documentoInvalido() é falso para um CPF válido após o blur', () => {
    const fixture = criarFixture();
    fixture.componentInstance.onDocumentoChange('11144477735');
    fixture.componentInstance.onDocumentoBlur();

    expect(fixture.componentInstance['documentoInvalido']()).toBe(false);
  });

  it('onCepChange() aplica a máscara xxxxx-xxx conforme o usuário digita', () => {
    const fixture = criarFixture();

    fixture.componentInstance.onCepChange('87010000');
    expect(fixture.componentInstance['cepDestino']()).toBe('87010-000');

    fixture.componentInstance.onCepChange('8701');
    expect(fixture.componentInstance['cepDestino']()).toBe('8701');

    fixture.componentInstance.onCepChange('87010000999');
    expect(fixture.componentInstance['cepDestino']()).toBe('87010-000');
  });

  it('consulta a preferência (debounced) e compõe o endereço a partir dos campos separados quando o método é Correios', fakeAsync(() => {
    const fixture = criarFixture();
    carrinho.adicionar(criarItem());
    fixture.componentInstance['nome'].set('Fulano');
    fixture.componentInstance['email'].set('fulano@teste.com');
    fixture.componentInstance['telefone'].set('44999998888');
    fixture.componentInstance['documento'].set('111.444.777-35');
    fixture.componentInstance['metodo'].set('CORREIOS');
    fixture.componentInstance['cepDestino'].set('87010-000');
    fixture.componentInstance['logradouro'].set('Rua das Flores');
    fixture.componentInstance['numero'].set('123');
    fixture.componentInstance['complemento'].set('Apto 45');
    fixture.componentInstance['cidade'].set('Maringá');
    fixture.componentInstance['estado'].set('PR');
    fixture.detectChanges();
    tick(400);

    expect(checkoutService.preferencia).toHaveBeenCalled();
    const requestEnviado = checkoutService.preferencia.calls.mostRecent().args[0];
    expect(requestEnviado.envio.cepDestino).toBe('87010-000');
    expect(requestEnviado.envio.enderecoEntrega).toBe('Rua das Flores, 123, Apto 45 - Maringá/PR');
  }));

  it('compõe o endereço sem o complemento quando ele não é preenchido (campo opcional)', fakeAsync(() => {
    const fixture = criarFixture();
    carrinho.adicionar(criarItem());
    fixture.componentInstance['nome'].set('Fulano');
    fixture.componentInstance['email'].set('fulano@teste.com');
    fixture.componentInstance['telefone'].set('44999998888');
    fixture.componentInstance['documento'].set('111.444.777-35');
    fixture.componentInstance['metodo'].set('CORREIOS');
    fixture.componentInstance['cepDestino'].set('87010-000');
    fixture.componentInstance['logradouro'].set('Rua das Flores');
    fixture.componentInstance['numero'].set('123');
    fixture.componentInstance['cidade'].set('Maringá');
    fixture.componentInstance['estado'].set('PR');
    fixture.detectChanges();
    tick(400);

    const requestEnviado = checkoutService.preferencia.calls.mostRecent().args[0];
    expect(requestEnviado.envio.enderecoEntrega).toBe('Rua das Flores, 123 - Maringá/PR');
  }));

  it('consulta a preferência (debounced) quando os dados obrigatórios da retirada estão completos', fakeAsync(() => {
    const fixture = criarFixture();
    carrinho.adicionar(criarItem());
    preencherDadosRetirada(fixture);
    fixture.detectChanges();
    tick(399);
    expect(checkoutService.preferencia).not.toHaveBeenCalled();

    tick(1);
    expect(checkoutService.preferencia).toHaveBeenCalled();
    expect(fixture.componentInstance['totais']()).toEqual(totaisFake);
  }));

  it('em caso de erro do backend, expõe a mensagem de detail em preferenciaErro()', fakeAsync(() => {
    checkoutService.preferencia.and.returnValue(
      throwError(() => new HttpErrorResponse({ error: { detail: 'estoque insuficiente' } })),
    );
    const fixture = criarFixture();
    carrinho.adicionar(criarItem());
    preencherDadosRetirada(fixture);
    fixture.detectChanges();
    tick(400);

    expect(fixture.componentInstance['preferenciaErro']()).toBe('estoque insuficiente');
    expect(fixture.componentInstance['totais']()).toBeNull();
  }));

  it('irParaPagamento() não avança sem totais calculados', () => {
    const fixture = criarFixture();
    fixture.componentInstance.irParaPagamento();
    expect(fixture.componentInstance['passo']()).toBe('dados');
  });

  describe('com o Payment Brick', () => {
    let brickConfigCapturado: any;
    let brickControllerFake: { unmount: jasmine.Spy };

    beforeEach(() => {
      brickControllerFake = { unmount: jasmine.createSpy('unmount') };
      (window as any).MercadoPago = function () {
        return {
          bricks: () => ({
            create: (_tipo: string, _containerId: string, config: any) => {
              brickConfigCapturado = config;
              return Promise.resolve(brickControllerFake);
            },
          }),
        };
      };
    });

    function irParaPagamento(fixture: ReturnType<typeof criarFixture>, item: CartItem = criarItem()) {
      carrinho.adicionar(item);
      preencherDadosRetirada(fixture);
      fixture.detectChanges();
      tick(400);
      fixture.componentInstance.irParaPagamento();
      tick(0);
    }

    it('inicializa o Brick com o valor total (em reais) e o e-mail do comprador', fakeAsync(() => {
      const fixture = criarFixture();
      irParaPagamento(fixture);

      expect(fixture.componentInstance['passo']()).toBe('pagamento');
      expect(brickConfigCapturado.initialization.amount).toBe(totaisFake.totalPagoCents / 100);
      expect(brickConfigCapturado.initialization.payer.email).toBe('fulano@teste.com');
    }));

    it('onReady desliga o loading do Brick', fakeAsync(() => {
      const fixture = criarFixture();
      irParaPagamento(fixture);

      brickConfigCapturado.callbacks.onReady();

      expect(fixture.componentInstance['brickCarregando']()).toBe(false);
    }));

    it('onError com type "non_critical" não exibe erro (achado real: BIN incompleto durante digitação)', fakeAsync(() => {
      const fixture = criarFixture();
      irParaPagamento(fixture);

      brickConfigCapturado.callbacks.onError({ type: 'non_critical' });

      expect(fixture.componentInstance['brickErro']()).toBeNull();
      expect(fixture.componentInstance['brickCarregando']()).toBe(false);
    }));

    it('onError com outro type exibe mensagem de erro pro usuário', fakeAsync(() => {
      const fixture = criarFixture();
      irParaPagamento(fixture);

      brickConfigCapturado.callbacks.onError({ type: 'critical' });

      expect(fixture.componentInstance['brickErro']()).toBe(
        'Não foi possível carregar o formulário de pagamento. Tente novamente.',
      );
    }));

    it('onSubmit com sucesso limpa o carrinho e exibe a confirmação (com dados de Pix)', fakeAsync(() => {
      const respostaConfirmacao: CheckoutConfirmarResponse = {
        orderId: 'order-1',
        status: 'AGUARDANDO_PAGAMENTO',
        totalPagoCents: 10000,
        pixQrCode: 'copia-e-cola-fake',
        pixQrCodeBase64: 'base64-fake',
        pixExpiraEm: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };
      checkoutService.confirmar.and.returnValue(of(respostaConfirmacao));
      spyOn(carrinho, 'limpar');

      const fixture = criarFixture();
      irParaPagamento(fixture);

      let resolvido = false;
      const promise = brickConfigCapturado.callbacks.onSubmit({
        formData: { payment_method_id: 'pix', token: null },
      });
      promise.then(() => (resolvido = true));
      tick();

      expect(checkoutService.confirmar).toHaveBeenCalled();
      const bodyEnviado = checkoutService.confirmar.calls.mostRecent().args[0];
      expect(bodyEnviado.metodoPagamento).toBe('PIX');
      expect(carrinho.limpar).toHaveBeenCalled();
      expect(fixture.componentInstance['pixQrCode']()).toBe('copia-e-cola-fake');
      expect(fixture.componentInstance['pedidoConfirmado']()).toBe('order-1');
      expect(resolvido).toBe(true);
    }));

    it('acompanha o pagamento via polling e marca pagamentoConfirmado() quando o status vira PAGO', fakeAsync(() => {
      const respostaConfirmacao: CheckoutConfirmarResponse = {
        orderId: 'order-1',
        status: 'AGUARDANDO_PAGAMENTO',
        totalPagoCents: 10000,
        pixQrCode: 'copia-e-cola-fake',
        pixQrCodeBase64: 'base64-fake',
        pixExpiraEm: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };
      checkoutService.confirmar.and.returnValue(of(respostaConfirmacao));
      pedidoService.statusPagamento.and.returnValues(
        of({ status: 'AGUARDANDO_PAGAMENTO' }),
        of({ status: 'PAGO' }),
      );

      const fixture = criarFixture();
      irParaPagamento(fixture);
      brickConfigCapturado.callbacks.onSubmit({ formData: { payment_method_id: 'pix', token: null } });
      tick();

      expect(fixture.componentInstance['pagamentoConfirmado']()).toBe(false);

      tick(5000); // 1a checagem -- ainda aguardando
      expect(fixture.componentInstance['pagamentoConfirmado']()).toBe(false);

      tick(5000); // 2a checagem -- pago
      expect(fixture.componentInstance['pagamentoConfirmado']()).toBe(true);

      discardPeriodicTasks();
    }));

    it('marca pagamentoConfirmado() quando o status vira AGUARDANDO_LIBERACAO_PRE_VENDA (webhook nunca põe PAGO em pedido de pré-venda)', fakeAsync(() => {
      const respostaConfirmacao: CheckoutConfirmarResponse = {
        orderId: 'order-1',
        status: 'AGUARDANDO_PAGAMENTO',
        totalPagoCents: 5000,
        pixQrCode: 'copia-e-cola-fake',
        pixQrCodeBase64: 'base64-fake',
        pixExpiraEm: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };
      checkoutService.confirmar.and.returnValue(of(respostaConfirmacao));
      pedidoService.statusPagamento.and.returnValues(
        of({ status: 'AGUARDANDO_PAGAMENTO' }),
        of({ status: 'AGUARDANDO_LIBERACAO_PRE_VENDA' }),
      );

      const fixture = criarFixture();
      const itemPreVenda = criarItem({ isPresale: true, presaleDepositAmountCents: 5000 });
      irParaPagamento(fixture, itemPreVenda);
      brickConfigCapturado.callbacks.onSubmit({ formData: { payment_method_id: 'pix', token: null } });
      tick();

      expect(fixture.componentInstance['pedidoTinhaPreVenda']()).toBe(true);

      tick(5000);
      expect(fixture.componentInstance['pagamentoConfirmado']()).toBe(false);

      tick(5000);
      expect(fixture.componentInstance['pagamentoConfirmado']()).toBe(true);

      discardPeriodicTasks();
    }));

    it('marca pixExpirado() quando o prazo esgota sem confirmação', fakeAsync(() => {
      const respostaConfirmacao: CheckoutConfirmarResponse = {
        orderId: 'order-1',
        status: 'AGUARDANDO_PAGAMENTO',
        totalPagoCents: 10000,
        pixQrCode: 'copia-e-cola-fake',
        pixQrCodeBase64: 'base64-fake',
        pixExpiraEm: new Date(Date.now() + 5000).toISOString(), // expira no 1o tick
      };
      checkoutService.confirmar.and.returnValue(of(respostaConfirmacao));
      pedidoService.statusPagamento.and.returnValue(of({ status: 'AGUARDANDO_PAGAMENTO' }));

      const fixture = criarFixture();
      irParaPagamento(fixture);
      brickConfigCapturado.callbacks.onSubmit({ formData: { payment_method_id: 'pix', token: null } });
      tick();

      tick(5000);

      expect(fixture.componentInstance['pixExpirado']()).toBe(true);
      expect(fixture.componentInstance['pagamentoConfirmado']()).toBe(false);

      discardPeriodicTasks();
    }));

    it('onSubmit com cartão envia metodoPagamento CARTAO', fakeAsync(() => {
      checkoutService.confirmar.and.returnValue(
        of({
          orderId: 'order-1',
          status: 'PAGO',
          totalPagoCents: 10000,
          pixQrCode: null,
          pixQrCodeBase64: null,
          pixExpiraEm: null,
        }),
      );
      const fixture = criarFixture();
      irParaPagamento(fixture);

      const promise = brickConfigCapturado.callbacks.onSubmit({
        formData: { payment_method_id: 'visa', token: 'tok-123', installments: 1, issuer_id: '25' },
      });
      promise.catch(() => {});
      tick();

      const bodyEnviado = checkoutService.confirmar.calls.mostRecent().args[0];
      expect(bodyEnviado.metodoPagamento).toBe('CARTAO');
      expect(bodyEnviado.cardToken).toBe('tok-123');
    }));

    it('onSubmit com falha do backend rejeita a promise e exibe a mensagem de erro', fakeAsync(() => {
      checkoutService.confirmar.and.returnValue(
        throwError(() => new HttpErrorResponse({ error: { detail: 'pagamento recusado' } })),
      );
      const fixture = criarFixture();
      irParaPagamento(fixture);

      let rejeitado = false;
      const promise = brickConfigCapturado.callbacks.onSubmit({
        formData: { payment_method_id: 'visa' },
      });
      promise.catch(() => (rejeitado = true));
      tick();

      expect(rejeitado).toBe(true);
      expect(fixture.componentInstance['erro']()).toBe('pagamento recusado');
    }));

    it('voltarParaDados() desmonta o Brick e volta pro passo "dados"', fakeAsync(() => {
      const fixture = criarFixture();
      irParaPagamento(fixture);

      fixture.componentInstance.voltarParaDados();

      expect(brickControllerFake.unmount).toHaveBeenCalled();
      expect(fixture.componentInstance['passo']()).toBe('dados');
    }));
  });
});
