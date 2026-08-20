import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Lista } from './lista';
import { AdminPreVendaService } from '../../services/admin-pre-venda-service';
import { Product } from '../../../../catalogo/models/product';

function criarProduto(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    name: 'Ferrari F40',
    description: null,
    photos: [],
    priceCents: 30000,
    quantity: 1,
    weightGrams: 500,
    lengthCm: 20,
    widthCm: 10,
    heightCm: 8,
    isPresale: true,
    presaleDepositAmountCents: 5000,
    presaleStatus: 'RESERVADO',
    isFeatured: false,
    isActive: true,
    tags: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('Lista (pré-venda)', () => {
  let service: jasmine.SpyObj<AdminPreVendaService>;

  beforeEach(() => {
    service = jasmine.createSpyObj<AdminPreVendaService>('AdminPreVendaService', [
      'listarPendentes',
      'liberar',
    ]);
    service.listarPendentes.and.returnValue(
      of([criarProduto({ id: 'p1' }), criarProduto({ id: 'p2' })]),
    );

    TestBed.configureTestingModule({
      imports: [Lista],
      providers: [{ provide: AdminPreVendaService, useValue: service }],
    });
  });

  function criarFixture() {
    const fixture = TestBed.createComponent(Lista);
    fixture.detectChanges();
    return fixture;
  }

  it('carrega os produtos pendentes de pré-venda ao iniciar', () => {
    const fixture = criarFixture();
    expect(service.listarPendentes).toHaveBeenCalled();
    expect(fixture.componentInstance['produtos']().length).toBe(2);
    expect(fixture.componentInstance['carregando']()).toBe(false);
  });

  it('alternar() liga/desliga a seleção de um produto', () => {
    const fixture = criarFixture();
    fixture.componentInstance.alternar('p1');
    expect(fixture.componentInstance['selecionados']().has('p1')).toBe(true);

    fixture.componentInstance.alternar('p1');
    expect(fixture.componentInstance['selecionados']().has('p1')).toBe(false);
  });

  it('liberarSelecionados() não faz nada quando não há seleção', () => {
    const fixture = criarFixture();
    fixture.componentInstance.liberarSelecionados();
    expect(service.liberar).not.toHaveBeenCalled();
  });

  it('liberarSelecionados() libera os ids selecionados e recarrega a lista', () => {
    service.liberar.and.returnValue(of(undefined));
    const fixture = criarFixture();
    fixture.componentInstance.alternar('p1');

    fixture.componentInstance.liberarSelecionados();

    expect(service.liberar).toHaveBeenCalledWith(['p1']);
    expect(fixture.componentInstance['mensagem']()).toContain('1 produto(s) liberado(s)');
    expect(fixture.componentInstance['selecionados']().size).toBe(0);
    expect(service.listarPendentes).toHaveBeenCalledTimes(2);
  });

  it('liberarSelecionados() com falha exibe a mensagem de erro do backend', () => {
    service.liberar.and.returnValue(
      throwError(() => new HttpErrorResponse({ error: { detail: 'pedido já cancelado' } })),
    );
    const fixture = criarFixture();
    fixture.componentInstance.alternar('p1');

    fixture.componentInstance.liberarSelecionados();

    expect(fixture.componentInstance['mensagem']()).toBe('pedido já cancelado');
    expect(fixture.componentInstance['liberando']()).toBe(false);
  });
});
