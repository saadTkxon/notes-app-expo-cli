// app/(auth)/signup.tsx
import { auth } from "@/lib/firebase";
import { router } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
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
  success: "#6FCF97",
};

const getPasswordStrength = (pw: string) => {
  if (pw.length === 0) return { score: 0, label: "", color: "transparent" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak", color: DARK.danger };
  if (score === 2) return { score, label: "Fair", color: "#FFD580" };
  if (score === 3) return { score, label: "Good", color: "#80DEEA" };
  return { score, label: "Strong", color: DARK.success };
};

export default function SignUpScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const strength = getPasswordStrength(password);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const pressIn = () =>
    Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();

  const handleSignUp = async () => {
    setError("");
    if (!name.trim()) { setError("Please enter your full name."); shake(); return; }
    if (!email.trim() || !email.includes("@")) { setError("Please enter a valid email."); shake(); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); shake(); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); shake(); return; }
    if (!agreed) { setError("Please agree to the Terms & Privacy Policy."); shake(); return; }

    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(userCred.user, { displayName: name.trim() });
      // _layout.tsx ka onAuthStateChanged automatically (tabs) pe le jayega
    } catch (e: any) {
      const msg =
        e.code === "auth/email-already-in-use" ? "An account with this email already exists." :
        e.code === "auth/invalid-email" ? "Please enter a valid email address." :
        e.code === "auth/weak-password" ? "Password is too weak. Use at least 6 characters." :
        "Sign up failed. Please try again.";
      setError(msg);
      shake();
    } finally {
      setLoading(false);
    }
  };

  const iStyle = (field: string) => [
    styles.inputWrapper,
    focusedField === field && styles.inputWrapperFocused,
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={DARK.bg} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── DECORATION ── */}
          <View style={styles.topDecor} pointerEvents="none">
            <View style={[styles.orb, styles.orbLarge]} />
            <View style={[styles.orb, styles.orbSmall]} />
          </View>

          {/* ── HEADER ── */}
          <View style={styles.header}>
            <View style={styles.logoMark}>
              <Text style={styles.logoGlyph}>✎</Text>
            </View>
            <Text style={styles.heading}>Create Account</Text>
            <Text style={styles.subheading}>Start capturing your ideas today.</Text>
          </View>

          {/* ── FORM ── */}
          <Animated.View style={[styles.form, { transform: [{ translateX: shakeAnim }] }]}>

            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>FULL NAME</Text>
              <View style={iStyle("name")}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor={DARK.textMuted}
                  value={name}
                  onChangeText={(t) => { setName(t); setError(""); }}
                  autoCapitalize="words"
                  selectionColor={DARK.accent}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>EMAIL</Text>
              <View style={iStyle("email")}>
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
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <View style={iStyle("password")}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Min. 8 characters"
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
              {password.length > 0 && (
                <View style={styles.strengthRow}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3, 4].map((i) => (
                      <View key={i} style={[styles.strengthBar, { backgroundColor: i <= strength.score ? strength.color : DARK.border }]} />
                    ))}
                  </View>
                  <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
              <View style={[
                iStyle("confirm"),
                confirmPassword.length > 0 && password !== confirmPassword && styles.inputWrapperError,
                confirmPassword.length > 0 && password === confirmPassword && styles.inputWrapperSuccess,
              ]}>
                <Text style={styles.inputIcon}>🔐</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  placeholderTextColor={DARK.textMuted}
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); setError(""); }}
                  secureTextEntry={!showConfirm}
                  selectionColor={DARK.accent}
                  onFocus={() => setFocusedField("confirm")}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.eyeIcon}>{showConfirm ? "🙈" : "👁"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms */}
            <TouchableOpacity style={styles.termsRow} onPress={() => setAgreed(!agreed)} activeOpacity={0.7}>
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            {/* Error */}
            {error !== "" && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {error}</Text>
              </View>
            )}

            {/* Sign Up Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.primaryBtnLoading]}
                onPress={handleSignUp}
                onPressIn={pressIn}
                onPressOut={pressOut}
                disabled={loading}
                activeOpacity={1}
              >
                <Text style={styles.primaryBtnText}>
                  {loading ? "Creating account..." : "Create Account →"}
                </Text>
              </TouchableOpacity>
            </Animated.View>

          </Animated.View>

          {/* ── FOOTER ── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DARK.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  topDecor: { position: "absolute", top: -40, left: -40 },
  orb: { position: "absolute", borderRadius: 999, opacity: 0.12 },
  orbLarge: { width: 200, height: 200, backgroundColor: DARK.accent, top: 0, left: 0 },
  orbSmall: { width: 90, height: 90, backgroundColor: "#6FCF97", top: 100, left: 80 },
  header: { alignItems: "center", marginBottom: 32, marginTop: 16 },
  logoMark: { width: 56, height: 56, borderRadius: 18, backgroundColor: DARK.accentDim, borderWidth: 1, borderColor: DARK.accent, justifyContent: "center", alignItems: "center", marginBottom: 14 },
  logoGlyph: { fontSize: 24, color: DARK.accent },
  heading: { fontSize: 28, fontWeight: "800", color: DARK.text, letterSpacing: -0.8, marginBottom: 6 },
  subheading: { fontSize: 14, color: DARK.textSub, letterSpacing: 0.2 },
  form: { gap: 16 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 11, fontWeight: "700", color: DARK.textMuted, letterSpacing: 1.5 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: DARK.surface, borderRadius: 14, borderWidth: 1, borderColor: DARK.border, paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
  inputWrapperFocused: { borderColor: DARK.accent, backgroundColor: DARK.surfaceHigh },
  inputWrapperError: { borderColor: DARK.danger },
  inputWrapperSuccess: { borderColor: DARK.success },
  inputIcon: { fontSize: 15, width: 20, textAlign: "center" },
  input: { flex: 1, fontSize: 15, color: DARK.text, padding: 0 },
  eyeIcon: { fontSize: 15 },
  strengthRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2 },
  strengthBars: { flexDirection: "row", gap: 4, flex: 1 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, minWidth: 44, textAlign: "right" },
  termsRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginTop: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: DARK.border, backgroundColor: DARK.surface, justifyContent: "center", alignItems: "center", marginTop: 1, flexShrink: 0 },
  checkboxChecked: { borderColor: DARK.accent, backgroundColor: DARK.accentDim },
  checkmark: { fontSize: 13, color: DARK.accent, fontWeight: "800", lineHeight: 16 },
  termsText: { fontSize: 13, color: DARK.textSub, lineHeight: 20, flex: 1 },
  termsLink: { color: DARK.accent, fontWeight: "700" },
  errorBox: { backgroundColor: "rgba(255,90,90,0.12)", borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,90,90,0.25)", padding: 12 },
  errorText: { fontSize: 13, color: DARK.danger, fontWeight: "600" },
  primaryBtn: { backgroundColor: DARK.accent, borderRadius: 16, paddingVertical: 17, alignItems: "center", marginTop: 4, shadowColor: DARK.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 },
  primaryBtnLoading: { opacity: 0.7 },
  primaryBtnText: { fontSize: 16, fontWeight: "800", color: DARK.bg, letterSpacing: 0.3 },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 32 },
  footerText: { fontSize: 14, color: DARK.textSub },
  footerLink: { fontSize: 14, fontWeight: "800", color: DARK.accent },
});
