export type ShippingMethod = 'RETIRADA' | 'CORREIOS';
export type PaymentMethod = 'CARTAO' | 'PIX';

export interface CheckoutItemRequest {
  productId: string;
  quantity: number;
}

export interface CompradorRequest {
  nome: string;
  email: string;
  telefone: string | null;
}

export interface EnvioRequest {
  metodo: ShippingMethod;
  enderecoEntrega: string | null;
  cepDestino: string | null;
  telefoneContato: string | null;
}

export interface CheckoutPreferenciaRequest {
  itens: CheckoutItemRequest[];
  comprador: CompradorRequest;
  envio: EnvioRequest;
}

export interface CheckoutPreferenciaResponse {
  subtotalItensCents: number;
  totalEntradaPreVendaCents: number;
  shippingCostCents: number;
  totalPagoCents: number;
  temPreVenda: boolean;
}

export interface CheckoutConfirmarRequest extends CheckoutPreferenciaRequest {
  cardToken: string | null;
  paymentMethodId: string;
  installments: number | null;
  issuerId: string | null;
  metodoPagamento: PaymentMethod;
}

export interface CheckoutConfirmarResponse {
  orderId: string;
  status: string;
  totalPagoCents: number;
  pixQrCode: string | null;
  pixQrCodeBase64: string | null;
}
