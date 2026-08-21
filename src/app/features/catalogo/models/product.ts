export interface Tag {
  id: string;
  name: string;
}

export interface ProductPhoto {
  id: string;
  url: string;
  isFavorite: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  photos: ProductPhoto[];
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
  isActive: boolean;
  tags: Tag[];
  createdAt: string;
}

/** Foto favorita do produto, ou a primeira se nenhuma estiver marcada, ou null se não houver fotos. */
export function fotoCapa(produto: Pick<Product, 'photos'>): string | null {
  if (produto.photos.length === 0) {
    return null;
  }
  return (produto.photos.find((p) => p.isFavorite) ?? produto.photos[0]).url;
}
