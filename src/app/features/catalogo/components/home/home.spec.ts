import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of } from 'rxjs';
import { Home } from './home';
import { ProdutoService } from '../../services/produto-service';
import { Product } from '../../models/product';

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
    isFeatured: true,
    isActive: true,
    tags: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('Home', () => {
  let service: jasmine.SpyObj<ProdutoService>;

  beforeEach(() => {
    service = jasmine.createSpyObj<ProdutoService>('ProdutoService', ['destaque']);
    service.destaque.and.returnValue(of([criarProduto()]));

    TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([]), { provide: ProdutoService, useValue: service }],
    });
  });

  it('carrega os produtos em destaque', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    expect(fixture.componentInstance['destaques']()?.length).toBe(1);
  });

  it('exibe 3 skeleton cards enquanto a chamada esta em voo', () => {
    const chamada = new Subject<Product[]>();
    service.destaque.and.returnValue(chamada);

    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-skeleton-card').length).toBe(3);
    expect(fixture.nativeElement.querySelectorAll('app-produto-card').length).toBe(0);

    chamada.next([criarProduto()]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-skeleton-card').length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('app-produto-card').length).toBe(1);
  });

  it('define título/description/canonical da página ao iniciar', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();

    expect(document.title).toContain('ArPe');
    expect(document.querySelector('meta[name="description"]')).not.toBeNull();
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toMatch(/\/$/);
  });
});
