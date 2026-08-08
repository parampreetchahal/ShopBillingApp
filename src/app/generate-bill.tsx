import { useCart } from "@/context/CartContext";
import { saveBill, saveBillItem } from "@/database/db";
import { syncEverything } from "@/lib/sync";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function GenerateBillScreen() {
  const { cart, clearCart } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const grandTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const handleGenerate = async () => {
    if (cart.length === 0) {
      Alert.alert("Empty Bill", "Please add products first.");
      return;
    }

    const finalCustomerName =
      customerName.trim() === "" ? "Walk-in Customer" : customerName.trim();

    const now = new Date();

    const invoiceNumber = `INV-${Date.now()}`;

    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();

    console.log("========================================");
    console.log("Starting invoice generation...");
    console.log("Invoice:", invoiceNumber);
    console.log("Customer:", finalCustomerName);
    console.log("Items:", cart.length);
    console.log("Grand Total:", grandTotal);

    // --------------------------------------------------
    // STEP 1: Save the bill locally in SQLite
    // --------------------------------------------------

    console.log("Saving bill locally...");

    const billId = saveBill(
      invoiceNumber,
      finalCustomerName,
      mobile.trim(),
      date,
      time,
      grandTotal,
    );

    if (!billId) {
      console.log("ERROR: Could not save invoice locally.");

      Alert.alert("Error", "Could not save invoice.");

      return;
    }

    console.log("Bill saved locally.");
    console.log("Local Bill ID:", billId);

    // --------------------------------------------------
    // STEP 2: Save every bill item locally
    // --------------------------------------------------

    console.log("Saving bill items locally...");

    let billItemsSaved = 0;

    for (const item of cart) {
      const itemResult = saveBillItem(
        Number(billId),
        item.barcode,
        item.name,
        item.quantity,
        item.price,
        item.price * item.quantity,
      );

      if (itemResult) {
        billItemsSaved++;
      }
    }

    console.log(`Bill items saved locally: ${billItemsSaved}/${cart.length}`);

    // --------------------------------------------------
    // STEP 3: Sync SQLite → Supabase
    // --------------------------------------------------

    try {
      console.log("Starting bill cloud synchronization...");

      const syncResult = await syncEverything();

      console.log("Bill cloud synchronization result:");
      console.log(syncResult);

      if (syncResult.billsUploaded > 0 || syncResult.billItemsUploaded > 0) {
        console.log("Bill successfully synchronized with Supabase.");
      } else {
        console.log("No bill records were uploaded during this sync.");
        console.log("The bill remains safely stored locally.");
      }
    } catch (error) {
      console.log("Bill cloud synchronization error:", error);

      // IMPORTANT:
      // We do NOT delete the bill.
      // It remains in SQLite and can be synchronized later.
    }

    console.log("Invoice generation completed.");
    console.log("========================================");

    // --------------------------------------------------
    // STEP 4: Clear cart only after local save succeeded
    // --------------------------------------------------

    clearCart();

    Alert.alert("Success", `Invoice ${invoiceNumber} generated successfully.`, [
      {
        text: "OK",
        onPress: () => router.replace("/history"),
      },
    ]);
  };

  return (
    <View
      style={{
        flex: 1,
        padding: 20,
        backgroundColor: "#fff",
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          marginBottom: 25,
        }}
      >
        🧾 Generate Invoice
      </Text>

      <Text style={{ marginBottom: 6 }}>Customer Name</Text>

      <TextInput
        placeholderTextColor="#6B7280"
        value={customerName}
        onChangeText={setCustomerName}
        placeholder="Enter customer name"
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 8,
          padding: 12,
          marginBottom: 18,
        }}
      />

      <Text style={{ marginBottom: 6 }}>Mobile Number</Text>

      <TextInput
        placeholderTextColor="#6B7280"
        value={mobile}
        onChangeText={setMobile}
        keyboardType="phone-pad"
        placeholder="Enter mobile number"
        maxLength={10}
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 8,
          padding: 12,
          marginBottom: 25,
        }}
      />

      <View
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 10,
          padding: 15,
          marginBottom: 30,
        }}
      >
        <Text>Total Items : {totalItems}</Text>

        <Text
          style={{
            marginTop: 10,
            fontSize: 20,
            fontWeight: "bold",
          }}
        >
          Grand Total : ₹{grandTotal}
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleGenerate}
        style={{
          backgroundColor: "#007AFF",
          padding: 16,
          borderRadius: 8,
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
          Generate Invoice
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          marginTop: 15,
          padding: 16,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "#007AFF",
        }}
      >
        <Text
          style={{
            color: "#007AFF",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          Cancel
        </Text>
      </TouchableOpacity>
    </View>
  );
}
