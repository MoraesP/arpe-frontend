export interface Tag {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  photoUrl: string | null;
  priceCents: number;
  quantity: number;
  weightGrams: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  isPresale: boolean;
  presaleDepositAmountCents: number | null;
  presaleStatus: 'RESERVADO' | 'DISPONIVEL' | null;
  isFeatured: boolean;
  tags: Tag[];
  createdAt: string;
}
