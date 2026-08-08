import { useCart } from "@/context/CartContext";
import { router } from "expo-router";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CartScreen() {
  const {
    cart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
    updatePrice,
  } = useCart();

  const grandTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleClearBill = () => {
    Alert.alert(
      "Clear Current Bill",
      "Are you sure you want to remove all items from the current bill?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: clearCart,
        },
      ],
    );
  };

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Text style={styles.emptyIconText}>+</Text>
        </View>

        <Text style={styles.emptyTitle}>Current Bill</Text>

        <Text style={styles.emptyDescription}>
          Your bill is empty. Scan a product or add a loose item to get started.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/scan-product")}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Scan Product</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/loose-item")}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Add Loose Item</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Current Bill</Text>

          <Text style={styles.subtitle}>
            {totalItems} {totalItems === 1 ? "item" : "items"}
          </Text>
        </View>

        <View style={styles.itemBadge}>
          <Text style={styles.itemBadgeText}>{totalItems}</Text>
        </View>
      </View>

      {/* Cart */}
      <FlatList
        data={cart}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            {/* Product header */}
            <View style={styles.productHeader}>
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.name}
                </Text>

                <Text style={styles.barcode}>Barcode: {item.barcode}</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => removeFromCart(item.id)}
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Quantity */}
            <View style={styles.quantitySection}>
              <Text style={styles.sectionLabel}>Quantity</Text>

              <View style={styles.quantityControls}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => decreaseQuantity(item.id)}
                  style={styles.quantityButton}
                >
                  <Text style={styles.quantityButtonText}>−</Text>
                </TouchableOpacity>

                <View style={styles.quantityValue}>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => increaseQuantity(item.id)}
                  style={styles.quantityButton}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Price */}
            <View style={styles.priceSection}>
              <Text style={styles.sectionLabel}>Selling Price</Text>

              <View style={styles.priceRow}>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.currency}>₹</Text>

                  <TextInput
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    value={item.price.toString()}
                    keyboardType="numeric"
                    onChangeText={(text) =>
                      updatePrice(item.id, Number(text) || 0)
                    }
                    style={styles.priceInput}
                  />
                </View>

                <View style={styles.itemTotal}>
                  <Text style={styles.itemTotalLabel}>Item Total</Text>

                  <Text style={styles.itemTotalValue}>
                    ₹{item.price * item.quantity}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      />

      {/* Bottom summary */}
      <View style={styles.bottomPanel}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Items</Text>

          <Text style={styles.summaryValue}>{totalItems}</Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Grand Total</Text>

          <Text style={styles.totalValue}>₹{grandTotal}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/loose-item")}
            style={styles.outlineButton}
          >
            <Text style={styles.outlineButtonText}>+ Loose Item</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleClearBill}
            style={styles.clearButton}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/generate-bill")}
          style={styles.generateButton}
        >
          <Text style={styles.generateButtonText}>Generate Invoice</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#6B7280",
  },

  itemBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
  },

  itemBadgeText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 18,
  },

  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  productInfo: {
    flex: 1,
    paddingRight: 15,
  },

  productName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 23,
  },

  barcode: {
    marginTop: 5,
    fontSize: 12,
    color: "#9CA3AF",
  },

  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },

  removeButtonText: {
    color: "#6B7280",
    fontSize: 24,
    lineHeight: 26,
    fontWeight: "400",
  },

  quantitySection: {
    marginTop: 18,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 8,
  },

  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },

  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },

  quantityButtonText: {
    fontSize: 23,
    fontWeight: "500",
    color: "#111827",
  },

  quantityValue: {
    minWidth: 55,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  quantityText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
  },

  priceSection: {
    marginTop: 18,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  priceInputContainer: {
    flex: 1,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },

  currency: {
    marginLeft: 13,
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
  },

  priceInput: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },

  itemTotal: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },

  itemTotalLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
  },

  itemTotalValue: {
    marginTop: 2,
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
  },

  bottomPanel: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  summaryLabel: {
    fontSize: 14,
    color: "#6B7280",
  },

  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 7,
  },

  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  totalValue: {
    fontSize: 25,
    fontWeight: "800",
    color: "#111827",
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  outlineButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },

  outlineButtonText: {
    textAlign: "center",
    color: "#374151",
    fontSize: 14,
    fontWeight: "700",
  },

  clearButton: {
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 11,
    backgroundColor: "#F3F4F6",
  },

  clearButtonText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "700",
  },

  generateButton: {
    marginTop: 12,
    backgroundColor: "#111827",
    paddingVertical: 16,
    borderRadius: 13,
  },

  generateButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
  },

  emptyContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  emptyIconText: {
    fontSize: 32,
    fontWeight: "300",
    color: "#374151",
  },

  emptyTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#111827",
  },

  emptyDescription: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 25,
  },

  primaryButton: {
    width: "100%",
    backgroundColor: "#111827",
    paddingVertical: 16,
    borderRadius: 13,
    marginBottom: 11,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },

  secondaryButton: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },

  secondaryButtonText: {
    color: "#374151",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
});
