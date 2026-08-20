import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../../environments/environment';
import { AdminProdutoService, ProductRequest } from './admin-produto-service';

describe('AdminProdutoService', () => {
  let service: AdminProdutoService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  const request: ProductRequest = {
    name: 'Ferrari F40',
    description: 'Miniatura 1:18',
    priceCents: 29900,
    quantity: 5,
    weightGrams: 500,
    lengthCm: 20,
    widthCm: 10,
    heightCm: 8,
    isPresale: false,
    presaleDepositAmountCents: null,
    isFeatured: true,
    tags: ['carros'],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminProdutoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listar() faz GET em /admin/produtos', () => {
    service.listar().subscribe();

    const req = httpMock.expectOne(`${baseUrl}/admin/produtos`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('criar() faz POST em /admin/produtos com o corpo da requisição', () => {
    service.criar(request).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/admin/produtos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  it('editar() faz PUT em /admin/produtos/:id com o corpo da requisição', () => {
    service.editar('p1', request).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/admin/produtos/p1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  it('excluir() faz DELETE em /admin/produtos/:id', () => {
    service.excluir('p1').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/admin/produtos/p1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('adicionarFoto() faz POST multipart em /admin/produtos/:id/fotos com o arquivo', () => {
    const arquivo = new File(['conteudo-fake'], 'foto.jpg', { type: 'image/jpeg' });

    service.adicionarFoto('p1', arquivo).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/admin/produtos/p1/fotos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    expect((req.request.body as FormData).get('file')).toBe(arquivo);
    req.flush({});
  });

  it('removerFoto() faz DELETE em /admin/produtos/:id/fotos/:photoId', () => {
    service.removerFoto('p1', 'foto-1').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/admin/produtos/p1/fotos/foto-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('marcarFavorita() faz PUT em /admin/produtos/:id/fotos/:photoId/favorita', () => {
    service.marcarFavorita('p1', 'foto-1').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/admin/produtos/p1/fotos/foto-1/favorita`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });
});
