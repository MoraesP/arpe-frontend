import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { CartDrawer } from './cart-drawer';
import { Carrinho } from '../../../core/services/carrinho';
import { CartItem } from '../../../features/carrinho/models/cart-item';

function criarItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: 'p1',
    name: 'Ferrari F40',
    photoUrl: null,
    priceCents: 10000,
    isPresale: false,
    presaleDepositAmountCents: null,
    quantity: 2,
    stockQuantity: 10,
    ...overrides,
  };
}

describe('CartDrawer', () => {
  let carrinho: Carrinho;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [CartDrawer],
      providers: [provideRouter([]), { provide: PLATFORM_ID, useValue: 'browser' }],
    });
    carrinho = TestBed.inject(Carrinho);
    router = TestBed.inject(Router);
  });

  function criarFixture() {
    const fixture = TestBed.createComponent(CartDrawer);
    fixture.detectChanges();
    return fixture;
  }

  it('subtotalItem() usa o preço cheio para itens comuns', () => {
    const fixture = criarFixture();
    const item = criarItem({ priceCents: 10000, quantity: 3, isPresale: false });
    expect(fixture.componentInstance.subtotalItem(item)).toBe(30000);
  });

  it('subtotalItem() usa o valor de entrada para itens de pré-venda', () => {
    const fixture = criarFixture();
    const item = criarItem({ isPresale: true, presaleDepositAmountCents: 4000, quantity: 3 });
    expect(fixture.componentInstance.subtotalItem(item)).toBe(12000);
  });

  it('fechar() delega ao Carrinho.fecharDrawer()', () => {
    const fixture = criarFixture();
    spyOn(carrinho, 'fecharDrawer');
    fixture.componentInstance.fechar();
    expect(carrinho.fecharDrawer).toHaveBeenCalled();
  });

  it('remover() delega ao Carrinho.remover()', () => {
    const fixture = criarFixture();
    spyOn(carrinho, 'remover');
    fixture.componentInstance.remover('p1');
    expect(carrinho.remover).toHaveBeenCalledWith('p1');
  });

  it('irPara() fecha o drawer e navega para o caminho informado', () => {
    const fixture = criarFixture();
    spyOn(carrinho, 'fecharDrawer');
    spyOn(router, 'navigate');

    fixture.componentInstance.irPara('/checkout');

    expect(carrinho.fecharDrawer).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/checkout']);
  });
});
