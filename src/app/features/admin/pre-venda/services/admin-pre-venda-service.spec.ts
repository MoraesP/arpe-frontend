import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../../environments/environment';
import { AdminPreVendaService } from './admin-pre-venda-service';

describe('AdminPreVendaService', () => {
  let service: AdminPreVendaService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminPreVendaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listarPendentes() faz GET em /admin/pre-venda', () => {
    service.listarPendentes().subscribe();

    const req = httpMock.expectOne(`${baseUrl}/admin/pre-venda`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('liberar() faz POST em /admin/pre-venda/liberar com os productIds', () => {
    service.liberar(['p1', 'p2']).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/admin/pre-venda/liberar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ productIds: ['p1', 'p2'] });
    req.flush(null);
  });
});
