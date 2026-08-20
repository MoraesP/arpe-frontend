import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../../environments/environment';
import { DashboardService, DashboardResponse } from './dashboard-service';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('obterMetricas() faz GET em /admin/dashboard e devolve as métricas', () => {
    const resposta: DashboardResponse = {
      totalVendidoCents: 500000,
      pedidosPorStatus: { PAGO: 3, ENVIADO: 1 },
      produtosMaisVendidos: [{ productId: 'p1', productName: 'Ferrari', quantidadeVendida: 5 }],
    };

    service.obterMetricas().subscribe((res) => expect(res).toEqual(resposta));

    const req = httpMock.expectOne(`${baseUrl}/admin/dashboard`);
    expect(req.request.method).toBe('GET');
    req.flush(resposta);
  });
});
