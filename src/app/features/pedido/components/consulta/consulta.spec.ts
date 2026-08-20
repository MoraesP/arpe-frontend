import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Consulta } from './consulta';
import { PedidoService } from '../../services/pedido-service';
import { Order } from '../../models/order';

function criarOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    customerName: 'Fulano',
    customerEmail: 'fulano@teste.com',
    customerDocument: null,
    status: 'PAGO',
    shippingMethod: 'RETIRADA',
    shippingCostCents: 0,
    shippingAddress: null,
    pickupPhone: '44999998888',
    subtotalItensCents: 10000,
    totalEntradaPreVendaCents: 0,
    totalPagoCents: 10000,
    pixDiscountPercentage: null,
    pixDiscountAmountCents: 0,
    trackingCode: null,
    itens: [],
    createdAt: new Date().toISOString(),
    mercadoPagoPaymentIds: [],
    ...overrides,
  };
}

describe('Consulta', () => {
  let pedidoService: jasmine.SpyObj<PedidoService>;

  beforeEach(() => {
    pedidoService = jasmine.createSpyObj<PedidoService>('PedidoService', [
      'solicitarChave',
      'consultar',
    ]);
    TestBed.configureTestingModule({
      imports: [Consulta],
      providers: [{ provide: PedidoService, useValue: pedidoService }],
    });
  });

  function criarFixture() {
    const fixture = TestBed.createComponent(Consulta);
    fixture.detectChanges();
    return fixture;
  }

  it('inicia no passo "dados"', () => {
    const fixture = criarFixture();
    expect(fixture.componentInstance['passo']()).toBe('dados');
  });

  it('solicitarChave() com sucesso avança para o passo "chave"', () => {
    pedidoService.solicitarChave.and.returnValue(of(undefined));
    const fixture = criarFixture();
    fixture.componentInstance['orderId'].set(' order-1 ');
    fixture.componentInstance['email'].set(' fulano@teste.com ');

    fixture.componentInstance.solicitarChave();

    expect(pedidoService.solicitarChave).toHaveBeenCalledWith({
      orderId: 'order-1',
      email: 'fulano@teste.com',
    });
    expect(fixture.componentInstance['passo']()).toBe('chave');
    expect(fixture.componentInstance['carregando']()).toBe(false);
  });

  it('solicitarChave() com falha marca erro e permanece no passo "dados"', () => {
    pedidoService.solicitarChave.and.returnValue(throwError(() => new Error('falha de rede')));
    const fixture = criarFixture();

    fixture.componentInstance.solicitarChave();

    expect(fixture.componentInstance['erro']()).toBe(true);
    expect(fixture.componentInstance['passo']()).toBe('dados');
  });

  it('consultar() com sucesso preenche o resultado', () => {
    const order = criarOrder();
    pedidoService.consultar.and.returnValue(of(order));
    const fixture = criarFixture();
    fixture.componentInstance['chaveValidacao'].set('chave-123');

    fixture.componentInstance.consultar();

    expect(fixture.componentInstance['resultado']()).toEqual(order);
    expect(fixture.componentInstance['erro']()).toBe(false);
  });

  it('consultar() com falha marca erro e não preenche resultado', () => {
    pedidoService.consultar.and.returnValue(throwError(() => new Error('chave inválida')));
    const fixture = criarFixture();

    fixture.componentInstance.consultar();

    expect(fixture.componentInstance['erro']()).toBe(true);
    expect(fixture.componentInstance['resultado']()).toBeNull();
  });

  it('voltar() volta para o passo "dados" e limpa chave/erro/resultado', () => {
    pedidoService.consultar.and.returnValue(of(criarOrder()));
    const fixture = criarFixture();
    fixture.componentInstance['passo'].set('chave');
    fixture.componentInstance['chaveValidacao'].set('chave-123');
    fixture.componentInstance.consultar();

    fixture.componentInstance.voltar();

    expect(fixture.componentInstance['passo']()).toBe('dados');
    expect(fixture.componentInstance['chaveValidacao']()).toBe('');
    expect(fixture.componentInstance['erro']()).toBe(false);
    expect(fixture.componentInstance['resultado']()).toBeNull();
  });
});
