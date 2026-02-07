export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'FAILED';

export interface ImageInfo {
  original_name: string;
  web_url: string;
  thumb_url: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string | null;
  name_en: string;
  name_vi: string;
  description_en: string;
  description_vi: string;
  category: string;
  status: ProductStatus;
  images: ImageInfo[];
  specific_attributes: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
