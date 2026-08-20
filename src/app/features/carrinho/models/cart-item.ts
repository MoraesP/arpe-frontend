export interface CartItem {
  productId: string;
  name: string;
  photoUrl: string | null;
  priceCents: number;
  isPresale: boolean;
  presaleDepositAmountCents: number | null;
  quantity: number;
  stockQuantity: number;
}
