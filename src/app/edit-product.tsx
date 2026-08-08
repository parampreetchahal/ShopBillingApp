import AppAlert from "@/components/AppAlert";
import { updateProduct } from "@/database/db";
import { syncEverything } from "@/lib/sync";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

export default function EditProductScreen() {
  const params = useLocalSearchParams();

  const [barcode, setBarcode] = useState(params.barcode as string);
  const [name, setName] = useState(params.name as string);
  const [mrp, setMrp] = useState(String(params.mrp));

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<
    "success" | "error" | "warning" | "info"
  >("info");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

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

  const handleUpdate = async () => {
    if (!barcode.trim() || !name.trim() || !mrp.trim()) {
      showAlert(
        "error",
        "Missing Information",
        "Please fill in all product fields before updating.",
      );
      return;
    }

    console.log("========================================");
    console.log("Updating product locally...");
    console.log({
      id: Number(params.id),
      barcode: barcode.trim(),
      name: name.trim(),
      mrp: Number(mrp),
    });

    // STEP 1: Update local SQLite
    const success = updateProduct(
      Number(params.id),
      barcode.trim(),
      name.trim(),
      Number(mrp),
    );

    if (!success) {
      console.log("Product update failed locally.");

      showAlert(
        "error",
        "Unable to Update",
        "The product could not be updated. Please try again.",
      );

      return;
    }

    console.log("Product updated locally.");
    console.log("Product is now marked as pending sync.");

    // STEP 2: Sync the updated product with Supabase
    try {
      console.log("Starting product update cloud synchronization...");

      const syncResult = await syncEverything();

      console.log("Product update synchronization result:");
      console.log(syncResult);

      if (syncResult.productsUploaded > 0) {
        console.log("Updated product successfully synchronized with Supabase.");
      } else {
        console.log("Updated product was not uploaded during this sync.");
        console.log("The updated product remains safely stored locally.");
      }
    } catch (error) {
      console.log("Product update synchronization error:", error);

      // Do NOT undo the local update.
      // It remains pending in SQLite.
    }

    console.log("========================================");

    showAlert(
      "success",
      "Product Updated",
      "The product was updated successfully.",
    );
  };

  const handleAlertDone = () => {
    setAlertVisible(false);
    router.back();
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#F7F6F2",
        paddingHorizontal: 20,
        paddingTop: 20,
      }}
    >
      {/* Header */}
      <View
        style={{
          marginBottom: 28,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: "#8A9195",
            fontWeight: "600",
            letterSpacing: 1,
            textTransform: "uppercase",
            marginBottom: 5,
          }}
        >
          Inventory
        </Text>

        <Text
          style={{
            fontSize: 28,
            fontWeight: "800",
            color: "#20282D",
          }}
        >
          Edit Product
        </Text>

        <Text
          style={{
            marginTop: 7,
            fontSize: 14,
            color: "#7B848A",
            lineHeight: 20,
          }}
        >
          Update the product information below.
        </Text>
      </View>

      {/* Form Card */}
      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: 18,
          borderWidth: 1,
          borderColor: "#E8E5DF",
        }}
      >
        {/* Barcode */}
        <View style={{ marginBottom: 18 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: "#59636A",
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            BARCODE
          </Text>

          <TextInput
            placeholder="Enter barcode"
            placeholderTextColor="#9AA0A4"
            value={barcode}
            onChangeText={setBarcode}
            style={{
              height: 50,
              borderWidth: 1,
              borderColor: "#E1DED7",
              backgroundColor: "#FAF9F6",
              borderRadius: 10,
              paddingHorizontal: 14,
              fontSize: 15,
              color: "#20282D",
            }}
          />
        </View>

        {/* Product Name */}
        <View style={{ marginBottom: 18 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: "#59636A",
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            PRODUCT NAME
          </Text>

          <TextInput
            placeholder="Enter product name"
            placeholderTextColor="#9AA0A4"
            value={name}
            onChangeText={setName}
            style={{
              height: 50,
              borderWidth: 1,
              borderColor: "#E1DED7",
              backgroundColor: "#FAF9F6",
              borderRadius: 10,
              paddingHorizontal: 14,
              fontSize: 15,
              color: "#20282D",
            }}
          />
        </View>

        {/* MRP */}
        <View style={{ marginBottom: 22 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: "#59636A",
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            MRP
          </Text>

          <View
            style={{
              height: 50,
              borderWidth: 1,
              borderColor: "#E1DED7",
              backgroundColor: "#FAF9F6",
              borderRadius: 10,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 14,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                color: "#68727A",
                marginRight: 5,
              }}
            >
              ₹
            </Text>

            <TextInput
              placeholder="Enter MRP"
              placeholderTextColor="#9AA0A4"
              value={mrp}
              onChangeText={setMrp}
              keyboardType="numeric"
              style={{
                flex: 1,
                fontSize: 15,
                color: "#20282D",
                paddingVertical: 0,
              }}
            />
          </View>
        </View>

        {/* Update Button */}
        <TouchableOpacity
          onPress={handleUpdate}
          activeOpacity={0.8}
          style={{
            backgroundColor: "#496875",
            paddingVertical: 14,
            borderRadius: 10,
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              textAlign: "center",
              fontSize: 15,
              fontWeight: "700",
            }}
          >
            Update Product
          </Text>
        </TouchableOpacity>

        {/* Cancel */}
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            paddingVertical: 14,
            marginTop: 5,
          }}
        >
          <Text
            style={{
              color: "#68727A",
              textAlign: "center",
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            Cancel
          </Text>
        </TouchableOpacity>
      </View>

      {/* Custom Alert */}
      <AppAlert
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        confirmText="Done"
        onConfirm={handleAlertDone}
      />
    </View>
  );
}
