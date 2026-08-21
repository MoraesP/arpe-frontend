import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { Detalhe } from './detalhe';
import { ProdutoService } from '../../services/produto-service';
import { Product } from '../../models/product';

function criarProduto(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    name: 'Hot Wheels Fusca 1967',
    description: 'Miniatura 1:64 de colecionador',
    photos: [{ id: 'foto1', url: 'https://x.com/foto.jpg', isFavorite: true }],
    priceCents: 4490,
    quantity: 3,
    weightGrams: 80,
    lengthCm: 12,
    widthCm: 6,
    heightCm: 5,
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

describe('Detalhe', () => {
  let service: jasmine.SpyObj<ProdutoService>;

  beforeEach(() => {
    localStorage.clear();
    service = jasmine.createSpyObj<ProdutoService>('ProdutoService', ['detalhe']);

    TestBed.configureTestingModule({
      imports: [Detalhe],
      providers: [
        { provide: ProdutoService, useValue: service },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: 'p1' })) },
        },
      ],
    });
  });

  function criarFixture(produto: Product) {
    service.detalhe.and.returnValue(of(produto));
    const fixture = TestBed.createComponent(Detalhe);
    fixture.detectChanges();
    return fixture;
  }

  it('define título/description/og:image a partir do produto carregado', () => {
    criarFixture(criarProduto());

    expect(document.title).toBe('Hot Wheels Fusca 1967 | ArPe');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Miniatura 1:64 de colecionador',
    );
    expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe('product');
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(
      'https://x.com/foto.jpg',
    );
  });

  it('usa uma descrição sintetizada quando o produto não tem description', () => {
    criarFixture(criarProduto({ description: null }));

    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toContain(
      'Hot Wheels Fusca 1967',
    );
  });

  it('injeta JSON-LD Product com preço em reais e disponibilidade InStock', () => {
    criarFixture(criarProduto({ priceCents: 4490, quantity: 3 }));

    const script = document.getElementById('seo-jsonld');
    const jsonLd = JSON.parse(script!.textContent!);

    expect(jsonLd['@type']).toBe('Product');
    expect(jsonLd.name).toBe('Hot Wheels Fusca 1967');
    expect(jsonLd.sku).toBe('p1');
    expect(jsonLd.offers.price).toBe('44.90');
    expect(jsonLd.offers.priceCurrency).toBe('BRL');
    expect(jsonLd.offers.availability).toBe('https://schema.org/InStock');
  });

  it('marca disponibilidade OutOfStock quando o estoque é zero', () => {
    criarFixture(criarProduto({ quantity: 0 }));

    const jsonLd = JSON.parse(document.getElementById('seo-jsonld')!.textContent!);
    expect(jsonLd.offers.availability).toBe('https://schema.org/OutOfStock');
  });
});
