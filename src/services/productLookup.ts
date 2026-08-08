import { lookupOpenFoodFacts } from "./openFoodFacts";
import { lookupSQLite } from "./sqliteLookup";

export interface ProductLookupResult {
  barcode: string;
  name: string;
  brand?: string;
  image?: string;
  mrp?: number;
}

const lookupUPCItemDB = async (
  barcode: string,
): Promise<ProductLookupResult | null> => {
  try {
    console.log("Searching UPCitemDB...");

    const response = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`,
    );

    if (!response.ok) {
      console.log("UPCitemDB HTTP Error:", response.status);
      return null;
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log("UPCitemDB: Product not found");
      return null;
    }

    const item = data.items[0];

    return {
      barcode,
      name: item.title || "",
      brand: item.brand || "",
      image: item.images?.[0] || "",
    };
  } catch (error) {
    console.log("UPCitemDB Error:", error);
    return null;
  }
};

export const lookupProduct = async (
  barcode: string,
): Promise<ProductLookupResult | null> => {
  console.log("Looking up:", barcode);

  // 1. SQLite
  const localProduct = lookupSQLite(barcode);
  if (localProduct) {
    console.log("Found in SQLite");
    return localProduct;
  }

  // 2. OpenFoodFacts
  const foodProduct = await lookupOpenFoodFacts(barcode);
  if (foodProduct) {
    console.log("Found in OpenFoodFacts");
    return foodProduct;
  }

  // 3. UPCitemDB
  const upcProduct = await lookupUPCItemDB(barcode);
  if (upcProduct) {
    console.log("Found in UPCitemDB");
    return upcProduct;
  }

  console.log("Product not found anywhere");

  return null;
};
