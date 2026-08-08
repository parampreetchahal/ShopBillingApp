import AppAlert from "@/components/AppAlert";
import { deleteProduct, getProducts } from "@/database/db";
import { syncEverything } from "@/lib/sync";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProductsScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<
    "success" | "error" | "warning" | "info" | "confirm"
  >("info");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertConfirmText, setAlertConfirmText] = useState("Done");
  const [alertCancelText, setAlertCancelText] = useState("Cancel");
  const [alertOnConfirm, setAlertOnConfirm] = useState<() => void>(
    () => () => setAlertVisible(false),
  );
  const [alertOnCancel, setAlertOnCancel] = useState<(() => void) | undefined>(
    undefined,
  );

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, []),
  );

  const loadProducts = () => {
    const data: any[] = getProducts() as any[];

    const visibleProducts = data.filter(
      (product) => product.sync_status !== "deleted",
    );

    setProducts(visibleProducts);
  };

  const showAlert = ({
    type,
    title,
    message,
    confirmText = "Done",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
  }: {
    type: "success" | "error" | "warning" | "info" | "confirm";
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertConfirmText(confirmText);
    setAlertCancelText(cancelText);

    setAlertOnConfirm(() => {
      if (onConfirm) {
        return onConfirm;
      }

      return () => setAlertVisible(false);
    });

    setAlertOnCancel(() => {
      if (onCancel) {
        return onCancel;
      }

      return () => setAlertVisible(false);
    });

    setAlertVisible(true);
  };

  const handleDelete = (id: number) => {
    showAlert({
      type: "confirm",
      title: "Delete Product?",
      message:
        "This product will be removed from your product list. If you are online, the deletion will also be synchronized with your cloud data.",
      confirmText: "Delete",
      cancelText: "Keep",
      onCancel: () => {
        setAlertVisible(false);
      },
      onConfirm: () => {
        setAlertVisible(false);

        setTimeout(() => {
          performDelete(id);
        }, 150);
      },
    });
  };

  const performDelete = async (id: number) => {
    console.log("========================================");
    console.log("Deleting product...");

    const success = deleteProduct(id);

    if (!success) {
      showAlert({
        type: "error",
        title: "Unable to Delete",
        message:
          "The product could not be deleted from local storage. Please try again.",
        confirmText: "Done",
      });

      return;
    }

    console.log("Product deletion saved locally.");

    try {
      console.log("Starting product deletion synchronization...");

      const syncResult = await syncEverything();

      console.log("Product deletion synchronization result:");
      console.log(syncResult);

      if (syncResult.productsUploaded > 0) {
        console.log("Product successfully deleted from Supabase.");

        showAlert({
          type: "success",
          title: "Product Deleted",
          message:
            "The product was removed successfully and the cloud data has been updated.",
          confirmText: "Done",
        });
      } else {
        console.log("Product deletion is still pending.");

        showAlert({
          type: "info",
          title: "Deleted Locally",
          message:
            "The product was removed from this device. Cloud deletion is pending and will be synchronized when you are online.",
          confirmText: "Done",
        });
      }
    } catch (error) {
      console.log("Product deletion synchronization error:", error);

      console.log("Product remains pending locally.");

      showAlert({
        type: "info",
        title: "Deleted Locally",
        message:
          "The product was removed from this device. Cloud synchronization will be attempted later.",
        confirmText: "Done",
      });
    }

    loadProducts();

    console.log("========================================");
  };

  const filteredProducts = products.filter((item) => {
    const query = search.toLowerCase().trim();

    return (
      item.name.toLowerCase().includes(query) ||
      item.barcode.toLowerCase().includes(query)
    );
  });

  const renderProduct = ({ item }: { item: any }) => (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 17,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E8E5DF",
      }}
    >
      {/* Product header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View
          style={{
            flex: 1,
            paddingRight: 12,
          }}
        >
          <Text
            style={{
              fontSize: 17,
              fontWeight: "700",
              color: "#20282D",
              lineHeight: 22,
            }}
            numberOfLines={2}
          >
            {item.name}
          </Text>

          <View
            style={{
              marginTop: 9,
              alignSelf: "flex-start",
              backgroundColor: "#F3F1EC",
              borderRadius: 7,
              paddingHorizontal: 9,
              paddingVertical: 5,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: "#68727A",
                letterSpacing: 0.2,
              }}
            >
              {item.barcode}
            </Text>
          </View>
        </View>

        <View
          style={{
            alignItems: "flex-end",
          }}
        >
          <Text
            style={{
              fontSize: 11,
              color: "#8A9195",
              marginBottom: 3,
            }}
          >
            MRP
          </Text>

          <Text
            style={{
              fontSize: 19,
              fontWeight: "800",
              color: "#344F5A",
            }}
          >
            ₹{item.mrp}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View
        style={{
          height: 1,
          backgroundColor: "#F0EEE9",
          marginVertical: 15,
        }}
      />

      {/* Actions */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/edit-product",
              params: {
                id: item.id,
                barcode: item.barcode,
                name: item.name,
                mrp: item.mrp,
              },
            })
          }
          activeOpacity={0.75}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#CBD5D9",
            borderRadius: 9,
            paddingVertical: 10,
            marginRight: 8,
          }}
        >
          <Text
            style={{
              textAlign: "center",
              color: "#496875",
              fontSize: 14,
              fontWeight: "700",
            }}
          >
            Edit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
          activeOpacity={0.75}
          style={{
            paddingHorizontal: 15,
            paddingVertical: 10,
            borderRadius: 9,
          }}
        >
          <Text
            style={{
              color: "#9A5C5C",
              fontSize: 14,
              fontWeight: "700",
            }}
          >
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#F7F6F2",
      }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <View>
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
              Products
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "#E9F0F1",
              borderRadius: 10,
              paddingHorizontal: 11,
              paddingVertical: 7,
            }}
          >
            <Text
              style={{
                color: "#496875",
                fontSize: 13,
                fontWeight: "700",
              }}
            >
              {products.length} {products.length === 1 ? "item" : "items"}
            </Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View
        style={{
          paddingHorizontal: 20,
          marginBottom: 12,
        }}
      >
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 13,
            borderWidth: 1,
            borderColor: "#E5E1DA",
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 14,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              color: "#8A9195",
              marginRight: 8,
            }}
          >
            ⌕
          </Text>

          <TextInput
            placeholder="Search by name or barcode"
            placeholderTextColor="#9AA0A4"
            value={search}
            onChangeText={setSearch}
            style={{
              flex: 1,
              height: 48,
              color: "#20282D",
              fontSize: 14,
            }}
          />
        </View>
      </View>

      {/* Product list */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProduct}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 4,
          paddingBottom: 30,
          flexGrow: filteredProducts.length === 0 ? 1 : undefined,
        }}
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 30,
              paddingBottom: 80,
            }}
          >
            <View
              style={{
                width: 58,
                height: 58,
                borderRadius: 29,
                backgroundColor: "#E9F0F1",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 15,
              }}
            >
              <Text
                style={{
                  fontSize: 25,
                  color: "#496875",
                }}
              >
                □
              </Text>
            </View>

            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#303A40",
                marginBottom: 6,
              }}
            >
              {search.trim() ? "No products found" : "No products yet"}
            </Text>

            <Text
              style={{
                textAlign: "center",
                color: "#7B848A",
                fontSize: 14,
                lineHeight: 21,
              }}
            >
              {search.trim()
                ? "Try searching with another product name or barcode."
                : "Products you add to your shop will appear here."}
            </Text>
          </View>
        }
      />

      <AppAlert
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        confirmText={alertConfirmText}
        cancelText={alertCancelText}
        onConfirm={alertOnConfirm}
        onCancel={alertOnCancel}
      />
    </View>
  );
}
