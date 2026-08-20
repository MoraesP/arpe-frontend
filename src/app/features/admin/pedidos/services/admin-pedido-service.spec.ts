import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../../environments/environment';
import { AdminPedidoService } from './admin-pedido-service';

describe('AdminPedidoService', () => {
  let service: AdminPedidoService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminPedidoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listar() sem status não envia query param', () => {
    service.listar().subscribe();

    const req = httpMock.expectOne(`${baseUrl}/admin/pedidos`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('status')).toBe(false);
    req.flush([]);
  });

  it('listar() com status envia como query param', () => {
    service.listar('PAGO').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/admin/pedidos?status=PAGO`);
    expect(req.request.params.get('status')).toBe('PAGO');
    req.flush([]);
  });

  it('listar() com status vazio (string) não envia query param', () => {
    service.listar('').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/admin/pedidos`);
    expect(req.request.params.has('status')).toBe(false);
    req.flush([]);
  });

  it('detalhe() faz GET em /admin/pedidos/:id', () => {
    service.detalhe('order-1').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/admin/pedidos/order-1`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('retiradaAgendada() faz POST em /admin/pedidos/:id/retirada-agendada sem corpo relevante', () => {
    service.retiradaAgendada('order-1').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/admin/pedidos/order-1/retirada-agendada`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({});
  });

  it('preparandoEnvio() faz POST em /admin/pedidos/:id/preparando-envio sem corpo relevante', () => {
    service.preparandoEnvio('order-1').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/admin/pedidos/order-1/preparando-envio`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({});
  });

  it('concluir() faz POST em /admin/pedidos/:id/concluir sem corpo relevante', () => {
    service.concluir('order-1').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/admin/pedidos/order-1/concluir`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({});
  });

  it('postar() faz POST em /admin/pedidos/:id/postar com o código de rastreio', () => {
    service.postar('order-1', 'BR123456789').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/admin/pedidos/order-1/postar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ trackingCode: 'BR123456789' });
    req.flush({});
  });

  it('cancelar() faz POST em /admin/pedidos/:id/cancelar sem corpo relevante', () => {
    service.cancelar('order-1').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/admin/pedidos/order-1/cancelar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({});
  });
});
