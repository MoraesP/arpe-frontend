import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { Carrinho } from './carrinho';
import { CartItem } from '../../features/carrinho/models/cart-item';

const STORAGE_KEY = 'arpe-carrinho';

function criarItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: 'p1',
    name: 'Miniatura Ferrari',
    photoUrl: null,
    priceCents: 15000,
    isPresale: false,
    presaleDepositAmountCents: null,
    quantity: 1,
    stockQuantity: 10,
    ...overrides,
  };
}

describe('Carrinho', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  function criarServico(): Carrinho {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    const carrinho = TestBed.inject(Carrinho);
    TestBed.tick();
    return carrinho;
  }

  it('inicia vazio quando não há nada no localStorage', () => {
    const carrinho = criarServico();
    expect(carrinho.itens()).toEqual([]);
    expect(carrinho.totalItens()).toBe(0);
    expect(carrinho.totalCents()).toBe(0);
  });

  it('carrega itens já salvos no localStorage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([criarItem({ quantity: 2 })]));
    const carrinho = criarServico();
    expect(carrinho.itens().length).toBe(1);
    expect(carrinho.totalItens()).toBe(2);
  });

  it('ignora localStorage corrompido e inicia vazio', () => {
    localStorage.setItem(STORAGE_KEY, '{não é json válido');
    const carrinho = criarServico();
    expect(carrinho.itens()).toEqual([]);
  });

  it('adicionar() insere um item novo e abre o drawer', () => {
    const carrinho = criarServico();
    carrinho.adicionar(criarItem());
    expect(carrinho.itens().length).toBe(1);
    expect(carrinho.drawerAberto()).toBe(true);
  });

  it('adicionar() soma a quantidade quando o produto já está no carrinho', () => {
    const carrinho = criarServico();
    carrinho.adicionar(criarItem({ quantity: 1 }));
    carrinho.adicionar(criarItem({ quantity: 2 }));
    expect(carrinho.itens().length).toBe(1);
    expect(carrinho.itens()[0].quantity).toBe(3);
  });

  it('fecharDrawer()/abrirDrawer() alternam a visibilidade', () => {
    const carrinho = criarServico();
    carrinho.abrirDrawer();
    expect(carrinho.drawerAberto()).toBe(true);
    carrinho.fecharDrawer();
    expect(carrinho.drawerAberto()).toBe(false);
  });

  it('atualizarQuantidade() altera a quantidade de um item existente', () => {
    const carrinho = criarServico();
    carrinho.adicionar(criarItem({ quantity: 1 }));
    carrinho.atualizarQuantidade('p1', 5);
    expect(carrinho.itens()[0].quantity).toBe(5);
  });

  it('atualizarQuantidade() remove o item quando a quantidade cai a zero ou menos', () => {
    const carrinho = criarServico();
    carrinho.adicionar(criarItem());
    carrinho.atualizarQuantidade('p1', 0);
    expect(carrinho.itens()).toEqual([]);
  });

  it('remover() tira o item do carrinho', () => {
    const carrinho = criarServico();
    carrinho.adicionar(criarItem({ productId: 'p1' }));
    carrinho.adicionar(criarItem({ productId: 'p2' }));
    carrinho.remover('p1');
    expect(carrinho.itens().map((i) => i.productId)).toEqual(['p2']);
  });

  it('limpar() esvazia o carrinho', () => {
    const carrinho = criarServico();
    carrinho.adicionar(criarItem());
    carrinho.limpar();
    expect(carrinho.itens()).toEqual([]);
  });

  it('totalItens() soma as quantidades de todos os itens', () => {
    const carrinho = criarServico();
    carrinho.adicionar(criarItem({ productId: 'p1', quantity: 2 }));
    carrinho.adicionar(criarItem({ productId: 'p2', quantity: 3 }));
    expect(carrinho.totalItens()).toBe(5);
  });

  it('temPreVenda() é true quando algum item é de pré-venda', () => {
    const carrinho = criarServico();
    carrinho.adicionar(criarItem({ isPresale: false }));
    expect(carrinho.temPreVenda()).toBe(false);
    carrinho.adicionar(
      criarItem({ productId: 'p2', isPresale: true, presaleDepositAmountCents: 5000 }),
    );
    expect(carrinho.temPreVenda()).toBe(true);
  });

  it('totalCents() usa o valor de entrada para itens de pré-venda e o preço cheio para os demais', () => {
    const carrinho = criarServico();
    carrinho.adicionar(
      criarItem({ productId: 'p1', priceCents: 10000, quantity: 2, isPresale: false }),
    );
    carrinho.adicionar(
      criarItem({
        productId: 'p2',
        priceCents: 30000,
        presaleDepositAmountCents: 5000,
        isPresale: true,
        quantity: 1,
      }),
    );
    // 2 * 10000 (preço cheio) + 1 * 5000 (entrada da pré-venda)
    expect(carrinho.totalCents()).toBe(25000);
  });

  it('persiste os itens no localStorage a cada mudança', () => {
    const carrinho = criarServico();
    carrinho.adicionar(criarItem());
    TestBed.tick();
    const salvo = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(salvo.length).toBe(1);
    expect(salvo[0].productId).toBe('p1');
  });

  it('não toca no localStorage/no acesso ao storage durante SSR (fora do browser)', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    const carrinho = TestBed.inject(Carrinho);
    TestBed.tick();
    expect(carrinho.itens()).toEqual([]);
    carrinho.adicionar(criarItem());
    TestBed.tick();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
