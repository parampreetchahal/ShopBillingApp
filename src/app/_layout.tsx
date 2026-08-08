import { initDatabase } from "@/database/db";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, router, useRootNavigationState } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { CartProvider } from "../context/CartContext";

const MODE_KEY = "app_mode";

export default function Layout() {
  const navigationState = useRootNavigationState();

  const [ready, setReady] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Prevent startup navigation from running repeatedly
  |--------------------------------------------------------------------------
  */

  const startupNavigationDone = useRef(false);

  /*
  |--------------------------------------------------------------------------
  | Initialize application
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true;

    const initializeApp = async () => {
      try {
        console.log("Initializing application...");

        /*
        --------------------------------------------------------------
        1. Initialize local database
        --------------------------------------------------------------
        */

        initDatabase();

        /*
        --------------------------------------------------------------
        2. Get selected mode
        --------------------------------------------------------------
        */

        const mode = await AsyncStorage.getItem(MODE_KEY);

        /*
        --------------------------------------------------------------
        3. No mode selected
        --------------------------------------------------------------
        */

        if (!mode) {
          if (!mounted) return;

          setReady(true);

          return;
        }

        /*
        --------------------------------------------------------------
        4. Offline mode
        --------------------------------------------------------------
        */

        if (mode === "offline") {
          if (!mounted) return;

          setReady(true);

          return;
        }

        /*
        --------------------------------------------------------------
        5. Online mode
        --------------------------------------------------------------
        */

        if (mode === "online") {
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (error) {
            console.log("Session Check Error:", error.message);
          }

          if (!mounted) return;

          if (session) {
            console.log("Existing Supabase session found");
          } else {
            console.log("No Supabase session found");
          }

          setReady(true);

          return;
        }

        /*
        --------------------------------------------------------------
        6. Invalid mode
        --------------------------------------------------------------
        */

        await AsyncStorage.removeItem(MODE_KEY);

        if (!mounted) return;

        setReady(true);
      } catch (error) {
        console.log("Application Initialization Error:", error);

        if (!mounted) return;

        setReady(true);
      }
    };

    initializeApp();

    return () => {
      mounted = false;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Initial navigation
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | This runs ONLY ONCE.
  |
  | It does NOT watch pathname.
  | Therefore /scan, /cart, /products, /history,
  | /profile, etc. can navigate normally.
  |
  */

  useEffect(() => {
    if (!ready) return;

    if (!navigationState?.key) {
      return;
    }

    if (startupNavigationDone.current) {
      return;
    }

    startupNavigationDone.current = true;

    const navigateOnStartup = async () => {
      try {
        const mode = await AsyncStorage.getItem(MODE_KEY);

        /*
        --------------------------------------------------------------
        No mode selected
        --------------------------------------------------------------
        */

        if (!mode) {
          router.replace("/mode-selection");
          return;
        }

        /*
        --------------------------------------------------------------
        Offline
        --------------------------------------------------------------
        */

        if (mode === "offline") {
          router.replace("/");
          return;
        }

        /*
        --------------------------------------------------------------
        Online
        --------------------------------------------------------------
        */

        if (mode === "online") {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session) {
            router.replace("/");
          } else {
            router.replace("/login");
          }

          return;
        }

        /*
        --------------------------------------------------------------
        Invalid mode
        --------------------------------------------------------------
        */

        await AsyncStorage.removeItem(MODE_KEY);

        router.replace("/mode-selection");
      } catch (error) {
        console.log("Startup Navigation Error:", error);
      }
    };

    navigateOnStartup();
  }, [ready, navigationState?.key]);

  /*
  |--------------------------------------------------------------------------
  | Startup loading screen
  |--------------------------------------------------------------------------
  */

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#F3F4F6",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            backgroundColor: "#FAFAFA",
            borderWidth: 1,
            borderColor: "#E5E7EB",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="small" color="#1479E8" />
        </View>
      </View>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | App Navigation
  |--------------------------------------------------------------------------
  */

  return (
    <CartProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: "Shop Billing",
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="mode-selection"
          options={{
            title: "Choose Mode",
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="login"
          options={{
            title: "Login",
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="profile"
          options={{
            title: "Profile",
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="auth/callback"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </CartProvider>
  );
}
