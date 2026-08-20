import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { CarrinhoPagina } from './carrinho-pagina';
import { Carrinho } from '../../../../core/services/carrinho';
import { CartItem } from '../../models/cart-item';

function criarItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: 'p1',
    name: 'Ferrari F40',
    photoUrl: null,
    priceCents: 10000,
    isPresale: false,
    presaleDepositAmountCents: null,
    quantity: 2,
    ...overrides,
  };
}

describe('CarrinhoPagina', () => {
  let carrinho: Carrinho;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [CarrinhoPagina],
      providers: [provideRouter([]), { provide: PLATFORM_ID, useValue: 'browser' }],
    });
    carrinho = TestBed.inject(Carrinho);
    router = TestBed.inject(Router);
  });

  function criarFixture() {
    const fixture = TestBed.createComponent(CarrinhoPagina);
    fixture.detectChanges();
    return fixture;
  }

  it('subtotalItem() usa o preço cheio para itens comuns e a entrada para pré-venda', () => {
    const fixture = criarFixture();
    expect(
      fixture.componentInstance.subtotalItem(criarItem({ priceCents: 10000, quantity: 2 })),
    ).toBe(20000);
    expect(
      fixture.componentInstance.subtotalItem(
        criarItem({ isPresale: true, presaleDepositAmountCents: 3000, quantity: 2 }),
      ),
    ).toBe(6000);
  });

  it('incrementar() aumenta a quantidade em 1', () => {
    const fixture = criarFixture();
    carrinho.adicionar(criarItem({ quantity: 1 }));
    fixture.componentInstance.incrementar(carrinho.itens()[0]);
    expect(carrinho.itens()[0].quantity).toBe(2);
  });

  it('decrementar() diminui a quantidade em 1', () => {
    const fixture = criarFixture();
    carrinho.adicionar(criarItem({ quantity: 2 }));
    fixture.componentInstance.decrementar(carrinho.itens()[0]);
    expect(carrinho.itens()[0].quantity).toBe(1);
  });

  it('decrementar() até zero remove o item (via Carrinho.atualizarQuantidade)', () => {
    const fixture = criarFixture();
    carrinho.adicionar(criarItem({ quantity: 1 }));
    fixture.componentInstance.decrementar(carrinho.itens()[0]);
    expect(carrinho.itens()).toEqual([]);
  });

  it('remover() tira o item do carrinho', () => {
    const fixture = criarFixture();
    carrinho.adicionar(criarItem());
    fixture.componentInstance.remover('p1');
    expect(carrinho.itens()).toEqual([]);
  });

  it('irParaCheckout() navega para /checkout', () => {
    const fixture = criarFixture();
    spyOn(router, 'navigate');
    fixture.componentInstance.irParaCheckout();
    expect(router.navigate).toHaveBeenCalledWith(['/checkout']);
  });
});
