// app/(auth)/login.tsx
import { auth } from "@/lib/firebase";
import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const DARK = {
  bg: "#0D0D0F",
  surface: "#18181C",
  surfaceHigh: "#222228",
  border: "#2A2A32",
  accent: "#7C6EFF",
  accentDim: "#3D3670",
  text: "#F0EFF8",
  textSub: "#8B8A9E",
  textMuted: "#4E4D5F",
  danger: "#FF5A5A",
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [error, setError] = useState("");

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const pressIn = () =>
    Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      shake();
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email.");
      shake();
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // _layout.tsx ka onAuthStateChanged automatically (tabs) pe le jayega
    } catch (e: any) {
      const msg =
        e.code === "auth/user-not-found" ? "No account found with this email." :
        e.code === "auth/wrong-password" ? "Incorrect password." :
        e.code === "auth/invalid-email" ? "Invalid email address." :
        e.code === "auth/invalid-credential" ? "Incorrect email or password." :
        "Login failed. Please try again.";
      setError(msg);
      shake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={DARK.bg} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>

          {/* ── DECORATION ── */}
          <View style={styles.topDecor} pointerEvents="none">
            <View style={[styles.orb, styles.orbLarge]} />
            <View style={[styles.orb, styles.orbSmall]} />
          </View>

          {/* ── BRAND ── */}
          <View style={styles.brand}>
            <View style={styles.logoMark}>
              <Text style={styles.logoGlyph}>✎</Text>
            </View>
            <Text style={styles.appName}>Notes</Text>
            <Text style={styles.tagline}>Your thoughts, beautifully organized.</Text>
          </View>

          {/* ── FORM ── */}
          <Animated.View style={[styles.form, { transform: [{ translateX: shakeAnim }] }]}>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>EMAIL</Text>
              <View style={[styles.inputWrapper, focusedField === "email" && styles.inputWrapperFocused]}>
                <Text style={styles.inputIcon}>✉</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={DARK.textMuted}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(""); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor={DARK.accent}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <TouchableOpacity onPress={() => Alert.alert("Forgot Password", "Feature coming soon!")}>
                  <Text style={styles.forgotLink}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.inputWrapper, focusedField === "password" && styles.inputWrapperFocused]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={DARK.textMuted}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(""); }}
                  secureTextEntry={!showPassword}
                  selectionColor={DARK.accent}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.eyeIcon}>{showPassword ? "🙈" : "👁"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Error */}
            {error !== "" && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {error}</Text>
              </View>
            )}

            {/* Sign In Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.primaryBtnLoading]}
                onPress={handleLogin}
                onPressIn={pressIn}
                onPressOut={pressOut}
                disabled={loading}
                activeOpacity={1}
              >
                <Text style={styles.primaryBtnText}>
                  {loading ? "Signing in..." : "Sign In →"}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign Up Link as button */}
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => router.push("/(auth)/signup")}
              activeOpacity={0.8}
            >
              <Text style={styles.outlineBtnText}>Create New Account</Text>
            </TouchableOpacity>

          </Animated.View>

          {/* ── FOOTER ── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DARK.bg },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  topDecor: { position: "absolute", top: -40, right: -40 },
  orb: { position: "absolute", borderRadius: 999, opacity: 0.15 },
  orbLarge: { width: 220, height: 220, backgroundColor: DARK.accent, top: 0, right: 0 },
  orbSmall: { width: 100, height: 100, backgroundColor: "#F48FB1", top: 120, right: 60 },
  brand: { alignItems: "center", marginBottom: 40 },
  logoMark: { width: 64, height: 64, borderRadius: 20, backgroundColor: DARK.accentDim, borderWidth: 1, borderColor: DARK.accent, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  logoGlyph: { fontSize: 28, color: DARK.accent },
  appName: { fontSize: 32, fontWeight: "800", color: DARK.text, letterSpacing: -1, marginBottom: 6 },
  tagline: { fontSize: 14, color: DARK.textSub, letterSpacing: 0.2 },
  form: { gap: 16 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 11, fontWeight: "700", color: DARK.textMuted, letterSpacing: 1.5 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  forgotLink: { fontSize: 12, color: DARK.accent, fontWeight: "600" },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: DARK.surface, borderRadius: 14, borderWidth: 1, borderColor: DARK.border, paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
  inputWrapperFocused: { borderColor: DARK.accent, backgroundColor: DARK.surfaceHigh },
  inputIcon: { fontSize: 16, width: 20, textAlign: "center" },
  input: { flex: 1, fontSize: 15, color: DARK.text, padding: 0 },
  eyeIcon: { fontSize: 16 },
  errorBox: { backgroundColor: "rgba(255,90,90,0.12)", borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,90,90,0.25)", padding: 12 },
  errorText: { fontSize: 13, color: DARK.danger, fontWeight: "600" },
  primaryBtn: { backgroundColor: DARK.accent, borderRadius: 16, paddingVertical: 17, alignItems: "center", marginTop: 4, shadowColor: DARK.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 },
  primaryBtnLoading: { opacity: 0.7 },
  primaryBtnText: { fontSize: 16, fontWeight: "800", color: DARK.bg, letterSpacing: 0.3 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: DARK.border },
  dividerText: { fontSize: 12, color: DARK.textMuted, fontWeight: "600" },
  outlineBtn: { borderRadius: 16, paddingVertical: 15, alignItems: "center", borderWidth: 1, borderColor: DARK.accent },
  outlineBtnText: { fontSize: 15, fontWeight: "700", color: DARK.accent },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 36 },
  footerText: { fontSize: 14, color: DARK.textSub },
  footerLink: { fontSize: 14, fontWeight: "800", color: DARK.accent },
});
