// app/_layout.tsx
import { auth } from "@/lib/firebase";
import { Stack, router, useRootNavigationState } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { View } from "react-native";

export const unstable_settings = {
  initialRouteName: "(auth)",
};

export default function RootLayout() {
  const navigationState = useRootNavigationState();
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!navigationState?.key) return;
    if (!authChecked) return;

    if (isLoggedIn) {
      router.replace("/(tabs)");
    } else {
      router.replace("/(auth)/login");
    }
  }, [navigationState?.key, authChecked, isLoggedIn]);

  if (!navigationState?.key || !authChecked) {
    return <View style={{ flex: 1, backgroundColor: "#0D0D0F" }} />;
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
