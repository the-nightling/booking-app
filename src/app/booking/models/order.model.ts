import { Product } from "./product.model";

export interface Order {
  id: string;
  productCatalogueId: string;
  customerId: string;
  quantity: number;
  timesBooked: number;
  productCatalogue: Product;
}
