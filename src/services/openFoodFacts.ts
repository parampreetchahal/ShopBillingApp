export interface ProductLookupResult {
  barcode: string;
  name: string;
  brand?: string;
  image?: string;
  mrp?: number;
}

export const lookupOpenFoodFacts = async (
  barcode: string,
): Promise<ProductLookupResult | null> => {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
    );

    const data = await response.json();

    if (data.status !== 1) {
      return null;
    }

    return {
      barcode,
      name: data.product.product_name || "",
      brand: data.product.brands || "",
      image: data.product.image_front_small_url || "",
    };
  } catch (error) {
    console.log("OpenFoodFacts Error:", error);
    return null;
  }
};
