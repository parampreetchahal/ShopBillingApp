import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

const MODE_KEY = "app_mode";

export default function ModeSelectionScreen() {
  const continueOffline = async () => {
    await AsyncStorage.setItem(MODE_KEY, "offline");
    router.replace("/");
  };

  const continueOnline = async () => {
    await AsyncStorage.setItem(MODE_KEY, "online");
    router.replace("/login");
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#F5F7FA",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 20,
          padding: 25,
          elevation: 4,
        }}
      >
        <Text
          style={{
            fontSize: 30,
            fontWeight: "800",
            textAlign: "center",
            color: "#111827",
          }}
        >
          Shop Billing
        </Text>

        <Text
          style={{
            textAlign: "center",
            color: "#6B7280",
            fontSize: 16,
            marginTop: 8,
            marginBottom: 30,
          }}
        >
          Choose how you want to use the app
        </Text>

        {/* Offline */}
        <TouchableOpacity
          onPress={continueOffline}
          activeOpacity={0.8}
          style={{
            backgroundColor: "#007AFF",
            padding: 18,
            borderRadius: 14,
            marginBottom: 14,
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              textAlign: "center",
              fontSize: 18,
              fontWeight: "700",
            }}
          >
            Continue Offline
          </Text>

          <Text
            style={{
              color: "rgba(255,255,255,0.85)",
              textAlign: "center",
              marginTop: 6,
              fontSize: 13,
            }}
          >
            No account required
          </Text>
        </TouchableOpacity>

        {/* Online */}
        <TouchableOpacity
          onPress={continueOnline}
          activeOpacity={0.8}
          style={{
            backgroundColor: "#FFFFFF",
            padding: 18,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#007AFF",
          }}
        >
          <Text
            style={{
              color: "#007AFF",
              textAlign: "center",
              fontSize: 18,
              fontWeight: "700",
            }}
          >
            Continue with Google
          </Text>

          <Text
            style={{
              color: "#6B7280",
              textAlign: "center",
              marginTop: 6,
              fontSize: 13,
            }}
          >
            Sync your data securely in the cloud
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            textAlign: "center",
            color: "#9CA3AF",
            fontSize: 12,
            marginTop: 22,
            lineHeight: 18,
          }}
        >
          You can change this choice later from Shop Settings.
        </Text>
      </View>
    </View>
  );
}
