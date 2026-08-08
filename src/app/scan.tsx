import { useCart } from "@/context/CartContext";
import { getProductByBarcode } from "@/database/db";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Button, Text, TouchableOpacity, View } from "react-native";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [lastProduct, setLastProduct] = useState<any>(null);

  const { addToCart, cart } = useCart();

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    setBarcode(data);

    const product: any = getProductByBarcode(data);

    if (!product) {
      Alert.alert("Product Not Found", "This barcode is not available.");

      setTimeout(() => {
        setScanned(false);
        setBarcode("");
      }, 2500);

      return;
    }

    addToCart({
      id: product.id,
      barcode: product.barcode,
      name: product.name,
      mrp: product.mrp,
      price: product.mrp,
      quantity: 1,
    });

    setLastProduct(product);

    setTimeout(() => {
      setScanned(false);
      setBarcode("");
    }, 2500);
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text
          style={{
            marginBottom: 15,
            fontSize: 16,
          }}
        >
          Camera permission required
        </Text>

        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "code128", "code39", "qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {/* Product Status */}
      <View
        style={{
          position: "absolute",
          bottom: 90,
          left: 20,
          right: 20,
          backgroundColor: "white",
          padding: 15,
          borderRadius: 12,
          elevation: 5,
        }}
      >
        {lastProduct ? (
          <>
            <Text
              style={{
                color: "#28A745",
                fontWeight: "bold",
                fontSize: 18,
              }}
            >
              ✓ Added Successfully
            </Text>

            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                marginTop: 8,
              }}
            >
              {lastProduct.name}
            </Text>

            <Text style={{ marginTop: 5 }}>MRP : ₹{lastProduct.mrp}</Text>

            <Text
              style={{
                marginTop: 5,
                color: "gray",
              }}
            >
              Barcode : {barcode}
            </Text>
          </>
        ) : (
          <>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
              }}
            >
              Scan Product
            </Text>

            <Text
              style={{
                marginTop: 5,
                color: "gray",
              }}
            >
              Point the camera at the barcode.
            </Text>
          </>
        )}
      </View>

      {/* View Cart Button */}
      <TouchableOpacity
        onPress={() => router.push("/cart")}
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          right: 20,
          backgroundColor: "#007AFF",
          padding: 16,
          borderRadius: 12,
        }}
      >
        <Text
          style={{
            color: "white",
            textAlign: "center",
            fontSize: 18,
            fontWeight: "bold",
          }}
        >
          View Current Bill ({totalItems})
        </Text>
      </TouchableOpacity>
    </View>
  );
}
