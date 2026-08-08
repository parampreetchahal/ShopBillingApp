import { clearLocalShopData } from "@/database/db";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.log("Get User Error:", error.message);
        setIsLoggedIn(false);
        return;
      }

      const user = data.user;

      if (user) {
        setIsLoggedIn(true);
        setEmail(user.email || "");

        const fullName =
          user.user_metadata?.full_name || user.user_metadata?.name || "";

        setName(fullName);
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.log("Profile Error:", error);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    router.push("/login");
  };

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out? Local shop data on this device will be cleared. Your synced cloud data will remain safe.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("========================================");
              console.log("Starting logout...");

              // STEP 1: Sign out from Supabase
              const { error } = await supabase.auth.signOut();

              if (error) {
                throw error;
              }

              console.log("Supabase session signed out.");

              // STEP 2: Clear previous user's local data
              const cleared = clearLocalShopData();

              if (!cleared) {
                throw new Error("Unable to clear local shop data.");
              }

              // STEP 3: Reset profile state
              setIsLoggedIn(false);
              setEmail("");
              setName("");

              console.log("Logout completed successfully.");
              console.log("========================================");

              Alert.alert(
                "Signed Out",
                "You have been signed out successfully.",
              );

              router.replace("/login");
            } catch (error: any) {
              console.log("Logout Error:", error);

              Alert.alert("Error", error?.message || "Could not sign out.");
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F5F7FA",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#F5F7FA",
        padding: 20,
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: "800",
          color: "#111827",
          marginBottom: 25,
        }}
      >
        Profile
      </Text>

      {/* Profile Card */}

      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: "#E5E7EB",
          marginBottom: 20,
        }}
      >
        <View
          style={{
            width: 65,
            height: 65,
            borderRadius: 33,
            backgroundColor: isLoggedIn ? "#E8F0FE" : "#F3F4F6",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 15,
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: "800",
              color: isLoggedIn ? "#4285F4" : "#6B7280",
            }}
          >
            {isLoggedIn
              ? name
                ? name.charAt(0).toUpperCase()
                : email
                  ? email.charAt(0).toUpperCase()
                  : "U"
              : "U"}
          </Text>
        </View>

        {isLoggedIn ? (
          <>
            <Text
              style={{
                fontSize: 19,
                fontWeight: "700",
                color: "#111827",
              }}
            >
              {name || "Google User"}
            </Text>

            <Text
              style={{
                color: "#6B7280",
                marginTop: 5,
                fontSize: 15,
              }}
            >
              {email}
            </Text>

            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: "#DCFCE7",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 20,
                marginTop: 15,
              }}
            >
              <Text
                style={{
                  color: "#166534",
                  fontWeight: "600",
                  fontSize: 12,
                }}
              >
                Online Sync Enabled
              </Text>
            </View>
          </>
        ) : (
          <>
            <Text
              style={{
                fontSize: 19,
                fontWeight: "700",
                color: "#111827",
              }}
            >
              Offline Mode
            </Text>

            <Text
              style={{
                color: "#6B7280",
                marginTop: 5,
                lineHeight: 20,
              }}
            >
              You are currently using the app without a Google account.
            </Text>

            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: "#F3F4F6",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 20,
                marginTop: 15,
              }}
            >
              <Text
                style={{
                  color: "#374151",
                  fontWeight: "600",
                  fontSize: 12,
                }}
              >
                Offline Only
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Online */}

      {isLoggedIn && (
        <>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 18,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                fontSize: 17,
                fontWeight: "700",
                color: "#111827",
                marginBottom: 8,
              }}
            >
              Cloud Backup
            </Text>

            <Text
              style={{
                color: "#6B7280",
                lineHeight: 20,
              }}
            >
              Your shop data can be synchronized with your Google account and
              restored after reinstalling the app.
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.8}
            style={{
              backgroundColor: "#DC2626",
              padding: 16,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                textAlign: "center",
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              Sign Out
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* Offline */}

      {!isLoggedIn && (
        <TouchableOpacity
          onPress={handleGoogleLogin}
          activeOpacity={0.8}
          style={{
            backgroundColor: "#4285F4",
            padding: 16,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              textAlign: "center",
              fontSize: 16,
              fontWeight: "700",
            }}
          >
            Sign in with Google
          </Text>
        </TouchableOpacity>
      )}

      {/* Back */}

      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          marginTop: 15,
          padding: 15,
        }}
      >
        <Text
          style={{
            color: "#007AFF",
            textAlign: "center",
            fontWeight: "600",
          }}
        >
          Back
        </Text>
      </TouchableOpacity>
    </View>
  );
}
