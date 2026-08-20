import { TestBed } from '@angular/core/testing';
import { PedidoDetalhe } from './pedido-detalhe';
import { Order } from '../../../features/pedido/models/order';

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
    saldoPreVendaCents: 0,
    pixDiscountPercentage: null,
    pixDiscountAmountCents: 0,
    trackingCode: null,
    itens: [],
    createdAt: new Date().toISOString(),
    mercadoPagoPaymentIds: [],
    ...overrides,
  };
}

describe('PedidoDetalhe', () => {
  function criarFixture(order: Order) {
    const fixture = TestBed.createComponent(PedidoDetalhe);
    fixture.componentRef.setInput('order', order);
    fixture.detectChanges();
    return fixture;
  }

  it('saldoPendente() é true enquanto aguarda liberação da pré-venda', () => {
    const fixture = criarFixture(
      criarOrder({ status: 'AGUARDANDO_LIBERACAO_PRE_VENDA', saldoPreVendaCents: 12000 }),
    );
    expect(fixture.componentInstance['saldoPendente']()).toBe(true);
    expect(fixture.componentInstance['saldoPago']()).toBe(false);
  });

  it('saldoPendente() é true enquanto aguarda pagamento do saldo (item já liberado)', () => {
    const fixture = criarFixture(
      criarOrder({ status: 'AGUARDANDO_PAGAMENTO_SALDO', saldoPreVendaCents: 12000 }),
    );
    expect(fixture.componentInstance['saldoPendente']()).toBe(true);
    expect(fixture.componentInstance['saldoPago']()).toBe(false);
  });

  it('saldoPago() é true depois do saldo pago (PAGO_COMPLETO em diante)', () => {
    const fixture = criarFixture(criarOrder({ status: 'PAGO_COMPLETO', saldoPreVendaCents: 12000 }));
    expect(fixture.componentInstance['saldoPago']()).toBe(true);
    expect(fixture.componentInstance['saldoPendente']()).toBe(false);
  });

  it('saldoPago() continua true em status posteriores (envio/conclusão)', () => {
    const fixture = criarFixture(criarOrder({ status: 'CONCLUIDO', saldoPreVendaCents: 12000 }));
    expect(fixture.componentInstance['saldoPago']()).toBe(true);
  });

  it('nenhum dos dois é true quando o pedido não tem pré-venda (saldoPreVendaCents = 0)', () => {
    const fixture = criarFixture(criarOrder({ status: 'AGUARDANDO_PAGAMENTO_SALDO', saldoPreVendaCents: 0 }));
    expect(fixture.componentInstance['saldoPendente']()).toBe(false);
    expect(fixture.componentInstance['saldoPago']()).toBe(false);
  });

  it('pedido cancelado não mostra nem pendente nem pago, mesmo com saldo > 0', () => {
    const fixture = criarFixture(criarOrder({ status: 'CANCELADO', saldoPreVendaCents: 12000 }));
    expect(fixture.componentInstance['saldoPendente']()).toBe(false);
    expect(fixture.componentInstance['saldoPago']()).toBe(false);
  });

  it('renderiza a linha "Saldo a quitar" quando pendente', () => {
    const fixture = criarFixture(
      criarOrder({ status: 'AGUARDANDO_PAGAMENTO_SALDO', saldoPreVendaCents: 12000 }),
    );
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Saldo a quitar');
    expect(texto).not.toContain('Saldo pré-venda pago');
  });

  it('renderiza a linha "Saldo pré-venda pago" quando já pago, sem o aviso de pendência', () => {
    const fixture = criarFixture(criarOrder({ status: 'PAGO_COMPLETO', saldoPreVendaCents: 12000 }));
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Saldo pré-venda pago');
    expect(texto).not.toContain('Saldo a quitar');
  });
});
