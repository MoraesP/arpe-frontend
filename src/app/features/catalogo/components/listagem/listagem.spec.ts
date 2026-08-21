import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of } from 'rxjs';
import { Listagem } from './listagem';
import { ProdutoService } from '../../services/produto-service';
import { Product, Tag } from '../../models/product';

function criarProduto(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    slug: 'ferrari-f40',
    name: 'Ferrari F40',
    description: null,
    photos: [],
    priceCents: 30000,
    quantity: 1,
    weightGrams: 500,
    lengthCm: 20,
    widthCm: 10,
    heightCm: 8,
    isPresale: false,
    presaleDepositAmountCents: null,
    presaleStatus: null,
    isFeatured: false,
    isActive: true,
    tags: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('Listagem', () => {
  let service: jasmine.SpyObj<ProdutoService>;

  beforeEach(() => {
    service = jasmine.createSpyObj<ProdutoService>('ProdutoService', ['listar', 'tags']);
    const tags: Tag[] = [{ id: 't1', name: 'carros' }];
    service.tags.and.returnValue(of(tags));
    service.listar.and.returnValue(of([criarProduto()]));

    TestBed.configureTestingModule({
      imports: [Listagem],
      providers: [provideRouter([]), { provide: ProdutoService, useValue: service }],
    });
  });

  it('define título/description/canonical da página ao iniciar', () => {
    const fixture = TestBed.createComponent(Listagem);
    fixture.detectChanges();

    expect(document.title).toContain('Catálogo');
    expect(document.title).toContain('ArPe');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toContain('/produtos');
  });

  it('carrega as tags disponíveis ao iniciar', () => {
    const fixture = TestBed.createComponent(Listagem);
    fixture.detectChanges();
    expect(fixture.componentInstance['tags']()).toEqual([{ id: 't1', name: 'carros' }]);
  });

  it('busca os produtos com os filtros iniciais (debounce de 250ms)', fakeAsync(() => {
    const fixture = TestBed.createComponent(Listagem);
    fixture.detectChanges();
    tick(250);

    expect(service.listar).toHaveBeenCalledWith({ busca: '', tag: '', ordenar: 'desc' });
    expect(fixture.componentInstance['produtos']()?.length).toBe(1);
  }));

  it('exibe 3 skeleton cards enquanto a busca esta em voo', fakeAsync(() => {
    const chamada = new Subject<Product[]>();
    service.listar.and.returnValue(chamada);

    const fixture = TestBed.createComponent(Listagem);
    fixture.detectChanges();
    tick(250);

    expect(fixture.nativeElement.querySelectorAll('app-skeleton-card').length).toBe(3);
    expect(fixture.nativeElement.querySelectorAll('app-produto-card').length).toBe(0);

    chamada.next([criarProduto()]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-skeleton-card').length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('app-produto-card').length).toBe(1);
  }));

  it('refaz a busca quando busca()/tag()/ordenar() mudam, respeitando o debounce', fakeAsync(() => {
    const fixture = TestBed.createComponent(Listagem);
    fixture.detectChanges();
    tick(250);
    service.listar.calls.reset();

    fixture.componentInstance['busca'].set('ferrari');
    fixture.detectChanges();
    tick(100);
    expect(service.listar).not.toHaveBeenCalled();

    tick(150);
    expect(service.listar).toHaveBeenCalledWith({ busca: 'ferrari', tag: '', ordenar: 'desc' });
  }));

  it('não refaz a busca duas vezes quando vários filtros mudam dentro da mesma janela de debounce', fakeAsync(() => {
    const fixture = TestBed.createComponent(Listagem);
    fixture.detectChanges();
    tick(250);
    service.listar.calls.reset();

    fixture.componentInstance['busca'].set('ferrari');
    fixture.componentInstance['tagSelecionada'].set('carros');
    fixture.detectChanges();
    tick(250);

    expect(service.listar).toHaveBeenCalledTimes(1);
    expect(service.listar).toHaveBeenCalledWith({
      busca: 'ferrari',
      tag: 'carros',
      ordenar: 'desc',
    });
  }));
});
