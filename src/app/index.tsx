import { getSettings } from "@/database/db";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const [shopName, setShopName] = useState("Mobile Shop");

  useFocusEffect(
    useCallback(() => {
      const settings: any = getSettings();

      if (settings?.shop_name?.trim()) {
        setShopName(settings.shop_name.trim());
      } else {
        setShopName("Mobile Shop");
      }
    }, []),
  );

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#F3F4F6",
      }}
    >
      <View
        style={{
          flex: 1,
          padding: 20,
        }}
      >
        {/* Header */}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 15,
            marginBottom: 28,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 29,
                fontWeight: "800",
                color: "#1F2937",
              }}
            >
              {shopName}
            </Text>

            <Text
              style={{
                color: "#6B7280",
                fontSize: 15,
                marginTop: 3,
              }}
            >
              Billing System
            </Text>
          </View>

          {/* Profile */}

          <TouchableOpacity
            onPress={() => router.push("/profile")}
            activeOpacity={0.7}
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: "#FAFAFA",
              borderWidth: 1,
              borderColor: "#E1E4E8",
              justifyContent: "center",
              alignItems: "center",
              marginLeft: 10,
            }}
          >
            <Text
              style={{
                fontSize: 21,
                fontWeight: "700",
                color: "#4B5563",
              }}
            >
              P
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}

        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: "#6B7280",
            marginBottom: 10,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Quick Actions
        </Text>

        {/* Scan Product */}

        <TouchableOpacity
          onPress={() => router.push("/scan")}
          activeOpacity={0.85}
          style={{
            backgroundColor: "#1479E8",
            paddingVertical: 18,
            paddingHorizontal: 20,
            borderRadius: 14,
            marginBottom: 12,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View style={mainIconStyle}>
            <Text style={mainIconText}>▣</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={mainButtonTitle}>Scan Product</Text>

            <Text style={mainButtonSubtitle}>Scan barcode and add to bill</Text>
          </View>

          <Text style={arrowStyle}>›</Text>
        </TouchableOpacity>

        {/* Current Bill */}

        <TouchableOpacity
          onPress={() => router.push("/cart")}
          activeOpacity={0.85}
          style={{
            backgroundColor: "#2FA85A",
            paddingVertical: 18,
            paddingHorizontal: 20,
            borderRadius: 14,
            marginBottom: 25,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View style={mainIconStyle}>
            <Text style={mainIconText}>₹</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={mainButtonTitle}>View Current Bill</Text>

            <Text style={mainButtonSubtitle}>
              Review items and generate invoice
            </Text>
          </View>

          <Text style={arrowStyle}>›</Text>
        </TouchableOpacity>

        {/* Management */}

        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: "#6B7280",
            marginBottom: 10,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Shop Management
        </Text>

        {/* Row 1 */}

        <View
          style={{
            flexDirection: "row",
            marginHorizontal: -5,
            marginBottom: 10,
          }}
        >
          <TouchableOpacity
            onPress={() => router.push("/add-product")}
            activeOpacity={0.75}
            style={gridButtonStyle}
          >
            <View style={iconCircleStyle}>
              <Text style={iconText}>＋</Text>
            </View>

            <Text style={gridButtonText}>Add Product</Text>

            <Text style={gridSubText}>New item</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/products")}
            activeOpacity={0.75}
            style={gridButtonStyle}
          >
            <View style={iconCircleStyle}>
              <Text style={iconText}>▤</Text>
            </View>

            <Text style={gridButtonText}>Products</Text>

            <Text style={gridSubText}>Product list</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2 */}

        <View
          style={{
            flexDirection: "row",
            marginHorizontal: -5,
            marginBottom: 18,
          }}
        >
          <TouchableOpacity
            onPress={() => router.push("/loose-item")}
            activeOpacity={0.75}
            style={gridButtonStyle}
          >
            <View style={iconCircleStyle}>
              <Text style={iconText}>◈</Text>
            </View>

            <Text style={gridButtonText}>Loose Item</Text>

            <Text style={gridSubText}>Manual entry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/history")}
            activeOpacity={0.75}
            style={gridButtonStyle}
          >
            <View style={iconCircleStyle}>
              <Text style={iconText}>▥</Text>
            </View>

            <Text style={gridButtonText}>Invoice History</Text>

            <Text style={gridSubText}>Past invoices</Text>
          </TouchableOpacity>
        </View>

        {/* Shop Settings */}

        <TouchableOpacity
          onPress={() => router.push("/settings")}
          activeOpacity={0.75}
          style={{
            alignSelf: "center",
            backgroundColor: "#E5E7EB",
            paddingVertical: 13,
            paddingHorizontal: 35,
            borderRadius: 10,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 17,
              marginRight: 8,
              color: "#4B5563",
            }}
          >
            ⚙
          </Text>

          <Text
            style={{
              color: "#374151",
              textAlign: "center",
              fontSize: 15,
              fontWeight: "700",
            }}
          >
            Shop Settings
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* -----------------------------
   Styles
----------------------------- */

const mainIconStyle = {
  width: 48,
  height: 48,
  borderRadius: 12,
  backgroundColor: "rgba(255,255,255,0.18)",
  justifyContent: "center" as const,
  alignItems: "center" as const,
  marginRight: 14,
};

const mainIconText = {
  color: "#FFFFFF",
  fontSize: 24,
  fontWeight: "700" as const,
};

const mainButtonTitle = {
  color: "#FFFFFF",
  fontSize: 18,
  fontWeight: "700" as const,
};

const mainButtonSubtitle = {
  color: "rgba(255,255,255,0.82)",
  fontSize: 13,
  marginTop: 3,
};

const arrowStyle = {
  color: "#FFFFFF",
  fontSize: 30,
  fontWeight: "300" as const,
  marginLeft: 8,
};

const gridButtonStyle = {
  flex: 1,
  backgroundColor: "#FAFAFA",
  minHeight: 105,
  padding: 14,
  borderRadius: 13,
  borderWidth: 1,
  borderColor: "#E2E4E7",
  marginHorizontal: 5,
};

const iconCircleStyle = {
  width: 34,
  height: 34,
  borderRadius: 17,
  backgroundColor: "#EEF0F2",
  justifyContent: "center" as const,
  alignItems: "center" as const,
  marginBottom: 7,
};

const iconText = {
  fontSize: 18,
  color: "#4B5563",
  fontWeight: "700" as const,
};

const gridButtonText = {
  fontSize: 15,
  fontWeight: "700" as const,
  color: "#1F2937",
};

const gridSubText = {
  fontSize: 11,
  color: "#8A9098",
  marginTop: 2,
};
