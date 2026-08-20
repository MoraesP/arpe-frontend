import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { CheckoutService } from './checkout-service';
import { CheckoutConfirmarRequest, CheckoutPreferenciaRequest } from '../models/checkout';

describe('CheckoutService', () => {
  let service: CheckoutService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CheckoutService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('preferencia() faz POST em /checkout/preferencia com o corpo da requisição', () => {
    const request: CheckoutPreferenciaRequest = {
      itens: [{ productId: 'p1', quantity: 2 }],
      comprador: { nome: 'Fulano', email: 'fulano@teste.com', telefone: '44999998888', document: '11144477735' },
      envio: {
        metodo: 'RETIRADA',
        enderecoEntrega: null,
        cepDestino: null,
        telefoneContato: '44999998888',
      },
    };

    service.preferencia(request).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/checkout/preferencia`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  it('confirmar() faz POST em /checkout/confirmar com o corpo da requisição', () => {
    const request: CheckoutConfirmarRequest = {
      itens: [{ productId: 'p1', quantity: 1 }],
      comprador: { nome: 'Fulano', email: 'fulano@teste.com', telefone: '44999998888', document: '11144477735' },
      envio: {
        metodo: 'CORREIOS',
        enderecoEntrega: 'Rua X, 123',
        cepDestino: '87000-000',
        telefoneContato: null,
      },
      cardToken: 'tok-123',
      paymentMethodId: 'visa',
      installments: 1,
      issuerId: '25',
      metodoPagamento: 'CARTAO',
    };

    service.confirmar(request).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/checkout/confirmar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });
});
