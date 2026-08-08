import { router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

export default function AuthCallbackScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/");
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#F3F4F6",
      }}
    />
  );
}
