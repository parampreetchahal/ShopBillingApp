import { addProduct } from "@/database/db";
import { syncEverything } from "@/lib/sync";
import { lookupProduct } from "@/services/productLookup";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

import AppAlert from "@/components/AppAlert";

export default function AddProductScreen() {
  const [barcode, setBarcode] = useState("");
  const [name, setName] = useState("");
  const [mrp, setMrp] = useState("");

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<
    "success" | "error" | "warning" | "info"
  >("info");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const params = useLocalSearchParams();

  const showAlert = (
    type: "success" | "error" | "warning" | "info",
    title: string,
    message: string,
  ) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (typeof params.barcode === "string" && params.barcode.length > 0) {
        setBarcode(params.barcode);

        console.log("Looking up:", params.barcode);

        const product = await lookupProduct(params.barcode);

        console.log("Lookup Result:", product);

        if (product) {
          setName(product.name);

          if (product.mrp !== undefined) {
            setMrp(product.mrp.toString());
          }
        }
      }
    };

    fetchProduct();
  }, [params.barcode]);

  const handleSave = async () => {
    if (barcode.trim() === "") {
      showAlert("error", "Barcode Required", "Please scan the barcode first.");
      return;
    }

    if (name.trim() === "") {
      showAlert(
        "error",
        "Product Name Required",
        "Please enter the product name.",
      );
      return;
    }

    if (mrp.trim() === "") {
      showAlert("error", "MRP Required", "Please enter the MRP.");
      return;
    }

    console.log("========================================");
    console.log("Saving product locally...");
    console.log({
      barcode,
      name,
      mrp: Number(mrp),
    });

    // STEP 1: Save to local SQLite
    const result = addProduct(barcode.trim(), name.trim(), Number(mrp));

    if (!result.success) {
      console.log("Local product save failed:", result.message);

      showAlert("error", "Unable to Save", result.message);
      return;
    }

    console.log("Product saved locally successfully.");
    console.log("Product is now marked as pending sync.");

    // STEP 2: Immediately try to sync with Supabase
    try {
      console.log("Starting product cloud synchronization...");

      const syncResult = await syncEverything();

      console.log("Product cloud synchronization result:");
      console.log(syncResult);

      if (syncResult.productsUploaded > 0) {
        console.log("Product successfully uploaded to Supabase.");
      } else {
        console.log(
          "Product was not uploaded to Supabase yet. " +
            "It remains safely stored locally and can be synced later.",
        );
      }
    } catch (error) {
      console.log("Product cloud synchronization error:", error);

      // Do NOT delete the local product.
      // It remains pending in SQLite.
    }

    console.log("========================================");

    setBarcode("");
    setName("");
    setMrp("");

    showAlert("success", "Product Saved", result.message);
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          marginBottom: 20,
        }}
      >
        Add Product
      </Text>

      <TouchableOpacity
        onPress={() => router.push("/scan-product")}
        style={{
          backgroundColor: "#28A745",
          padding: 15,
          borderRadius: 8,
          marginBottom: 15,
        }}
      >
        <Text
          style={{
            color: "white",
            textAlign: "center",
            fontSize: 16,
            fontWeight: "bold",
          }}
        >
          Scan Barcode
        </Text>
      </TouchableOpacity>

      <TextInput
        placeholder="Scan barcode first"
        value={barcode}
        editable={false}
        placeholderTextColor="#6B7280"
        style={{
          borderWidth: 1,
          padding: 12,
          marginBottom: 15,
          borderRadius: 8,
          backgroundColor: "#f2f2f2",
        }}
      />

      <TextInput
        placeholder="Product Name"
        value={name}
        onChangeText={setName}
        placeholderTextColor="#6B7280"
        style={{
          borderWidth: 1,
          padding: 12,
          marginBottom: 15,
          borderRadius: 8,
        }}
      />

      <TextInput
        placeholder="MRP"
        placeholderTextColor="#6B7280"
        value={mrp}
        onChangeText={setMrp}
        keyboardType="numeric"
        style={{
          borderWidth: 1,
          padding: 12,
          marginBottom: 15,
          borderRadius: 8,
        }}
      />

      <TouchableOpacity
        onPress={handleSave}
        style={{
          backgroundColor: "#007AFF",
          padding: 15,
          borderRadius: 8,
        }}
      >
        <Text
          style={{
            color: "white",
            textAlign: "center",
            fontSize: 16,
          }}
        >
          Save Product
        </Text>

        <AppAlert
          visible={alertVisible}
          type={alertType}
          title={alertTitle}
          message={alertMessage}
          confirmText="Done"
          onConfirm={() => {
            setAlertVisible(false);
          }}
        />
      </TouchableOpacity>
    </View>
  );
}
