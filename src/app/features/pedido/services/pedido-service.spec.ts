import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { PedidoService } from './pedido-service';

describe('PedidoService', () => {
  let service: PedidoService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PedidoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('solicitarChave() faz POST em /pedidos/solicitar-chave', () => {
    const request = { orderId: 'order-1', email: 'fulano@teste.com' };
    service.solicitarChave(request).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/pedidos/solicitar-chave`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(null);
  });

  it('consultar() faz POST em /pedidos/consultar', () => {
    const request = { orderId: 'order-1', email: 'fulano@teste.com', chaveValidacao: 'abc123' };
    service.consultar(request).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/pedidos/consultar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  it('statusPagamento() faz GET em /pedidos/:id/status-pagamento', () => {
    service.statusPagamento('order-1').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/pedidos/order-1/status-pagamento`);
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'PAGO' });
  });
});
