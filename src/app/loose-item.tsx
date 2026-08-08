import { useCart } from "@/context/CartContext";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AppAlert from "@/components/AppAlert";

export default function LooseItemScreen() {
  const { addToCart } = useCart();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "warning">(
    "success",
  );
  const [alertAction, setAlertAction] = useState<(() => void) | undefined>();

  const showAlert = (
    title: string,
    message: string,
    type: "success" | "error" | "warning",
    action?: () => void,
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertAction(() => action);
    setAlertVisible(true);
  };

  const handleAdd = () => {
    if (name.trim() === "") {
      showAlert("Missing Item Name", "Please enter the item name.", "warning");
      return;
    }

    if (price.trim() === "" || Number(price) <= 0) {
      showAlert("Invalid Price", "Please enter a valid price.", "warning");
      return;
    }

    if (quantity.trim() === "" || Number(quantity) <= 0) {
      showAlert(
        "Invalid Quantity",
        "Please enter a valid quantity.",
        "warning",
      );
      return;
    }

    addToCart({
      id: Date.now(),
      barcode: "LOOSE",
      name: name.trim(),
      mrp: Number(price),
      price: Number(price),
      quantity: Number(quantity),
    });

    showAlert(
      "Item Added",
      "The loose item has been added to the current bill.",
      "success",
      () => router.back(),
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Loose Item</Text>
            <Text style={styles.subtitle}>Add an item without a barcode</Text>
          </View>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Item Details</Text>

          <Text style={styles.label}>Item Name</Text>

          <TextInput
            placeholder="e.g. Loose Rice"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <Text style={styles.label}>Selling Price</Text>

          <View style={styles.priceContainer}>
            <Text style={styles.currency}>₹</Text>

            <TextInput
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
              style={styles.priceInput}
            />
          </View>

          <Text style={styles.label}>Quantity</Text>

          <TextInput
            placeholder="1"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
            style={styles.input}
          />

          {/* Preview */}
          <View style={styles.preview}>
            <View>
              <Text style={styles.previewLabel}>Estimated Total</Text>

              <Text style={styles.previewHint}>Price × Quantity</Text>
            </View>

            <Text style={styles.previewTotal}>
              ₹{price && quantity ? Number(price) * Number(quantity) : 0}
            </Text>
          </View>
        </View>

        {/* Action */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleAdd}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>Add to Current Bill</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => router.back()}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <AppAlert
          visible={alertVisible}
          title={alertTitle}
          message={alertMessage}
          type={alertType}
          onConfirm={() => {
            setAlertVisible(false);

            if (alertAction) {
              const action = alertAction;
              setAlertAction(undefined);
              action();
            }
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    flex: 1,
    padding: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  backText: {
    fontSize: 32,
    lineHeight: 36,
    color: "#111827",
    fontWeight: "300",
    marginTop: -3,
  },

  headerTextContainer: {
    flex: 1,
  },

  title: {
    fontSize: 27,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 20,
  },

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 8,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    color: "#111827",
    fontSize: 15,
    marginBottom: 18,
  },

  priceContainer: {
    height: 50,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  currency: {
    marginLeft: 14,
    fontSize: 17,
    fontWeight: "700",
    color: "#374151",
  },

  priceInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 9,
    color: "#111827",
    fontSize: 15,
  },

  preview: {
    marginTop: 2,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  previewLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },

  previewHint: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 3,
  },

  previewTotal: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },

  addButton: {
    backgroundColor: "#111827",
    paddingVertical: 16,
    borderRadius: 13,
    marginTop: 20,
  },

  addButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
  },

  cancelButton: {
    paddingVertical: 15,
    marginTop: 8,
  },

  cancelButtonText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "600",
  },
});
