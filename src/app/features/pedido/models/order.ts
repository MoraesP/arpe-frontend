export type OrderStatus =
  | 'AGUARDANDO_PAGAMENTO'
  | 'PAGO'
  | 'AGUARDANDO_LIBERACAO_PRE_VENDA'
  | 'AGUARDANDO_PAGAMENTO_SALDO'
  | 'PAGO_COMPLETO'
  | 'PREPARANDO_ENVIO'
  | 'ENVIADO'
  | 'CANCELADO';

export type ShippingMethod = 'RETIRADA' | 'CORREIOS';

export type PresaleItemStatus = 'RESERVADO' | 'DISPONIVEL';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  isPresale: boolean;
  depositAmountCents: number | null;
  remainingAmountCents: number | null;
  presaleItemStatus: PresaleItemStatus | null;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  shippingMethod: ShippingMethod;
  shippingCostCents: number;
  shippingAddress: string | null;
  pickupPhone: string | null;
  subtotalItensCents: number;
  totalEntradaPreVendaCents: number;
  totalPagoCents: number;
  trackingCode: string | null;
  itens: OrderItem[];
  createdAt: string;
}

export interface OrderSummary {
  id: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  totalPagoCents: number;
  createdAt: string;
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  PAGO: 'Pago',
  AGUARDANDO_LIBERACAO_PRE_VENDA: 'Aguardando liberação de pré-venda',
  AGUARDANDO_PAGAMENTO_SALDO: 'Aguardando pagamento do saldo',
  PAGO_COMPLETO: 'Pago (completo)',
  PREPARANDO_ENVIO: 'Preparando envio',
  ENVIADO: 'Enviado',
  CANCELADO: 'Cancelado',
};
