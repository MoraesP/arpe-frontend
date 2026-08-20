import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { ProdutoService } from './produto-service';
import { Product, Tag } from '../models/product';

describe('ProdutoService', () => {
  let service: ProdutoService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProdutoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('destaque() faz GET em /produtos/destaque', () => {
    const produtos: Product[] = [];
    service.destaque().subscribe((res) => expect(res).toBe(produtos));

    const req = httpMock.expectOne(`${baseUrl}/produtos/destaque`);
    expect(req.request.method).toBe('GET');
    req.flush(produtos);
  });

  it('listar() sem filtros não envia nenhum query param', () => {
    service.listar().subscribe();

    const req = httpMock.expectOne(`${baseUrl}/produtos`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush([]);
  });

  it('listar() envia busca/tag/ordenar como query params quando informados', () => {
    service.listar({ busca: 'ferrari', tag: 'carros', ordenar: 'asc' }).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === `${baseUrl}/produtos` && r.params.get('busca') === 'ferrari',
    );
    expect(req.request.params.get('tag')).toBe('carros');
    expect(req.request.params.get('ordenar')).toBe('asc');
    req.flush([]);
  });

  it('listar() omite filtros vazios/undefined', () => {
    service.listar({ busca: 'ferrari' }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/produtos?busca=ferrari`);
    expect(req.request.params.has('tag')).toBe(false);
    expect(req.request.params.has('ordenar')).toBe(false);
    req.flush([]);
  });

  it('detalhe() faz GET em /produtos/:id', () => {
    service.detalhe('abc-123').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/produtos/abc-123`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('tags() faz GET em /tags', () => {
    const tags: Tag[] = [{ id: 't1', name: 'carros' }];
    service.tags().subscribe((res) => expect(res).toEqual(tags));

    const req = httpMock.expectOne(`${baseUrl}/tags`);
    expect(req.request.method).toBe('GET');
    req.flush(tags);
  });
});
