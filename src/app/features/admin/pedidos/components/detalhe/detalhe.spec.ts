import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Detalhe } from './detalhe';
import { AdminPedidoService } from '../../services/admin-pedido-service';
import { Order } from '../../../../pedido/models/order';

function criarOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    customerName: 'Fulano',
    customerEmail: 'fulano@teste.com',
    status: 'PAGO',
    shippingMethod: 'CORREIOS',
    shippingCostCents: 1500,
    shippingAddress: 'Rua X, 123',
    pickupPhone: null,
    subtotalItensCents: 10000,
    totalEntradaPreVendaCents: 0,
    totalPagoCents: 11500,
    trackingCode: null,
    itens: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('Detalhe (admin/pedidos)', () => {
  let service: jasmine.SpyObj<AdminPedidoService>;

  beforeEach(() => {
    service = jasmine.createSpyObj<AdminPedidoService>('AdminPedidoService', [
      'detalhe',
      'postar',
      'cancelar',
    ]);
    service.detalhe.and.returnValue(of(criarOrder()));

    TestBed.configureTestingModule({
      imports: [Detalhe],
      providers: [
        { provide: AdminPedidoService, useValue: service },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'order-1' }) } },
        },
      ],
    });
  });

  function criarFixture() {
    const fixture = TestBed.createComponent(Detalhe);
    fixture.detectChanges();
    return fixture;
  }

  it('carrega o pedido pelo id da rota ao iniciar', () => {
    const fixture = criarFixture();
    expect(service.detalhe).toHaveBeenCalledWith('order-1');
    expect(fixture.componentInstance['order']()?.id).toBe('order-1');
    expect(fixture.componentInstance['carregando']()).toBe(false);
  });

  it('podeAgir() é true para pedidos que não foram enviados nem cancelados', () => {
    const fixture = criarFixture();
    expect(fixture.componentInstance.podeAgir()).toBe(true);
  });

  it('podeAgir() é false quando o pedido já foi enviado', () => {
    service.detalhe.and.returnValue(of(criarOrder({ status: 'ENVIADO' })));
    const fixture = criarFixture();
    expect(fixture.componentInstance.podeAgir()).toBe(false);
  });

  it('podeAgir() é false quando o pedido já foi cancelado', () => {
    service.detalhe.and.returnValue(of(criarOrder({ status: 'CANCELADO' })));
    const fixture = criarFixture();
    expect(fixture.componentInstance.podeAgir()).toBe(false);
  });

  it('postar() não faz nada sem código de rastreio preenchido', () => {
    const fixture = criarFixture();
    fixture.componentInstance.postar();
    expect(service.postar).not.toHaveBeenCalled();
  });

  it('postar() com código de rastreio atualiza o pedido e exibe mensagem de sucesso', () => {
    const pedidoPostado = criarOrder({ status: 'ENVIADO', trackingCode: 'BR123' });
    service.postar.and.returnValue(of(pedidoPostado));
    const fixture = criarFixture();
    fixture.componentInstance['trackingCode'].set('BR123');

    fixture.componentInstance.postar();

    expect(service.postar).toHaveBeenCalledWith('order-1', 'BR123');
    expect(fixture.componentInstance['order']()).toEqual(pedidoPostado);
    expect(fixture.componentInstance['mensagem']()).toBe('Pedido marcado como enviado.');
  });

  it('postar() com falha exibe a mensagem de erro do backend', () => {
    service.postar.and.returnValue(
      throwError(() => new HttpErrorResponse({ error: { detail: 'pedido já enviado' } })),
    );
    const fixture = criarFixture();
    fixture.componentInstance['trackingCode'].set('BR123');

    fixture.componentInstance.postar();

    expect(fixture.componentInstance['mensagem']()).toBe('pedido já enviado');
    expect(fixture.componentInstance['processando']()).toBe(false);
  });

  it('cancelar() não chama o serviço quando o admin não confirma o dialog', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    const fixture = criarFixture();

    fixture.componentInstance.cancelar();

    expect(service.cancelar).not.toHaveBeenCalled();
  });

  it('cancelar() confirmado atualiza o pedido e exibe mensagem de sucesso', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const pedidoCancelado = criarOrder({ status: 'CANCELADO' });
    service.cancelar.and.returnValue(of(pedidoCancelado));
    const fixture = criarFixture();

    fixture.componentInstance.cancelar();

    expect(service.cancelar).toHaveBeenCalledWith('order-1');
    expect(fixture.componentInstance['order']()).toEqual(pedidoCancelado);
    expect(fixture.componentInstance['mensagem']()).toBe('Pedido cancelado.');
  });
});
