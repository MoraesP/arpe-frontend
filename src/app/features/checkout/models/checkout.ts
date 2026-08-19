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
  cardToken: string;
  metodoPagamento: PaymentMethod;
}

export interface CheckoutConfirmarResponse {
  orderId: string;
  status: string;
  totalPagoCents: number;
}
