import { getProductByBarcode } from "@/database/db";

export interface ProductLookupResult {
  barcode: string;
  name: string;
  brand?: string;
  image?: string;
  mrp?: number;
}

export const lookupSQLite = (barcode: string): ProductLookupResult | null => {
  try {
    const product = getProductByBarcode(barcode) as {
      barcode: string;
      name: string;
      mrp: number;
    } | null;

    if (!product) {
      return null;
    }

    return {
      barcode: product.barcode,
      name: product.name,
      mrp: product.mrp,
    };
  } catch (error) {
    console.log("SQLite Lookup Error:", error);
    return null;
  }
};
