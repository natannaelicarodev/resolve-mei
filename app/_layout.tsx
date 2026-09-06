import { Poppins_400Regular } from '@expo-google-fonts/poppins/400Regular';
import { Poppins_500Medium } from '@expo-google-fonts/poppins/500Medium';
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins/600SemiBold';
import { Poppins_700Bold } from '@expo-google-fonts/poppins/700Bold';
import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { BootIntroGate } from '@/features/boot/BootIntroGate';
import { AppProviders } from '@/providers/AppProviders';
import { useTheme } from '@/theme';

void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ fade: false });

export default function RootLayout() {
  // Poppins é a única família do app. Quatro pesos cobrem toda a rampa
  // tipográfica; qualquer peso extra atrasa a splash sem uso correspondente.
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <AppErrorBoundary>
      <AppProviders>
        <BootIntroGate>
          <ThemedAppRoot />
        </BootIntroGate>
      </AppProviders>
    </AppErrorBoundary>
  );
}

function ThemedAppRoot() {
  const { colors } = useTheme();

  // This must be the first full-screen native view, not only a child of a
  // transparent GestureHandlerRootView. Android's edge-to-edge navigation bar
  // can expose this surface for a frame while native-stack swaps screens.
  return (
    <GestureHandlerRootView
      style={{ backgroundColor: colors.background, flex: 1 }}
    >
      <ThemedNavigation />
    </GestureHandlerRootView>
  );
}

function ThemedNavigation() {
  const { colors, resolvedTheme } = useTheme();

  useEffect(() => {
    NavigationBar.setStyle(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme]);

  return (
    <View style={{ backgroundColor: colors.background, flex: 1 }}>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(protected)" options={{ headerShown: false }} />
        <Stack.Screen
          name="auth-callback"
          options={{ animation: 'fade', headerShown: false }}
        />
        <Stack.Screen
          name="q"
          options={{ animation: 'fade', headerShown: false }}
        />
        {__DEV__ ? (
          <Stack.Screen
            name="design-system"
            options={{ title: 'Catálogo técnico' }}
          />
        ) : null}
      </Stack>
    </View>
  );
}
