import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { supabase } from "@/lib/supabase";
import { syncEverything } from "@/lib/sync";

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri({
  scheme: "shopbillingapp",
  path: "auth/callback",
});

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handledRef = useRef(false);

  /*
  |--------------------------------------------------------------------------
  | Create Supabase session
  |--------------------------------------------------------------------------
  */

  const createSessionFromUrl = async (url: string) => {
    if (handledRef.current) return;

    handledRef.current = true;

    try {
      const { params, errorCode } = QueryParams.getQueryParams(url);

      if (errorCode) {
        throw new Error(errorCode);
      }

      const { access_token, refresh_token } = params;

      if (!access_token || !refresh_token) {
        throw new Error("Authentication tokens were not received.");
      }

      /*
      --------------------------------------------------------------
      Set Supabase session
      --------------------------------------------------------------
      */

      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (error) {
        throw error;
      }

      console.log("Google login successful");

      /*
      --------------------------------------------------------------
      Restore cloud data
      --------------------------------------------------------------
      */

      setSyncing(true);

      console.log("Restoring shop data from Supabase...");

      const syncResult = await syncEverything();

      console.log("Initial synchronization result:", syncResult);

      /*
      --------------------------------------------------------------
      Check sync result
      --------------------------------------------------------------
      */

      if (!syncResult.success) {
        Alert.alert(
          "Sync Warning",
          "You are logged in, but some cloud data could not be synchronized. You can continue using the app and we will try again later.",
        );
      } else {
        console.log("Shop data restored successfully");
      }

      /*
      --------------------------------------------------------------
      Go to Home only AFTER synchronization
      --------------------------------------------------------------
      */

      router.replace("/");
    } catch (error: any) {
      console.log("Session Error:", error);

      Alert.alert(
        "Login Error",
        error?.message || "Could not complete Google login.",
      );
    } finally {
      setSyncing(false);

      setTimeout(() => {
        handledRef.current = false;
      }, 1000);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Google Login
  |--------------------------------------------------------------------------
  */

  const signInWithGoogle = async () => {
    try {
      setLoading(true);

      handledRef.current = false;

      console.log("Opening Google login...");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",

        options: {
          redirectTo,

          skipBrowserRedirect: true,
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.url) {
        throw new Error("Google login URL was not generated.");
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
      );

      console.log("Google browser authentication completed.");

      if (result.type === "success" && result.url) {
        await createSessionFromUrl(result.url);
      }
    } catch (error: any) {
      console.log("Google Login Error:", error);

      Alert.alert(
        "Google Login Failed",
        error?.message || "Unable to sign in with Google.",
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Offline Mode
  |--------------------------------------------------------------------------
  */

  const continueOffline = () => {
    router.replace("/");
  };

  /*
  |--------------------------------------------------------------------------
  | Loading / Syncing screen
  |--------------------------------------------------------------------------
  */

  if (syncing) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#F3F4F6",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 30,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 380,
            backgroundColor: "#FAFAFA",
            borderRadius: 20,
            padding: 30,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#E5E7EB",
            elevation: 3,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "#E8F0FE",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <ActivityIndicator size="large" color="#4285F4" />
          </View>

          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: "#111827",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Restoring your shop
          </Text>

          <Text
            style={{
              color: "#6B7280",
              fontSize: 15,
              lineHeight: 22,
              textAlign: "center",
            }}
          >
            Downloading your products, invoices and shop settings...
          </Text>
        </View>
      </View>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Login Screen
  |--------------------------------------------------------------------------
  */

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#F3F4F6",
        justifyContent: "center",
        paddingHorizontal: 25,
      }}
    >
      <View
        style={{
          backgroundColor: "#FAFAFA",
          borderRadius: 20,
          padding: 25,
          elevation: 4,
          borderWidth: 1,
          borderColor: "#E5E7EB",
        }}
      >
        <Text
          style={{
            fontSize: 30,
            fontWeight: "800",
            textAlign: "center",
            color: "#111827",
            marginBottom: 8,
          }}
        >
          Shop Billing
        </Text>

        <Text
          style={{
            textAlign: "center",
            color: "#6B7280",
            fontSize: 16,
            lineHeight: 23,
            marginBottom: 30,
          }}
        >
          Sync your shop data and access it across devices
        </Text>

        <TouchableOpacity
          onPress={signInWithGoogle}
          disabled={loading}
          activeOpacity={0.8}
          style={{
            backgroundColor: "#4285F4",
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 17,
                fontWeight: "700",
              }}
            >
              Continue with Google
            </Text>
          )}
        </TouchableOpacity>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginVertical: 22,
          }}
        >
          <View
            style={{
              flex: 1,
              height: 1,
              backgroundColor: "#E5E7EB",
            }}
          />

          <Text
            style={{
              marginHorizontal: 12,
              color: "#9CA3AF",
              fontSize: 13,
            }}
          >
            OR
          </Text>

          <View
            style={{
              flex: 1,
              height: 1,
              backgroundColor: "#E5E7EB",
            }}
          />
        </View>

        <TouchableOpacity
          onPress={continueOffline}
          disabled={loading}
          activeOpacity={0.8}
          style={{
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#D1D5DB",
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "#374151",
              fontSize: 17,
              fontWeight: "700",
            }}
          >
            Continue Offline
          </Text>

          <Text
            style={{
              color: "#9CA3AF",
              fontSize: 12,
              marginTop: 4,
            }}
          >
            No account required
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
