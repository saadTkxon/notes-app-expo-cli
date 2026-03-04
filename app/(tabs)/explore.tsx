// app/(tabs)/explore.tsx
import { auth, db } from "@/lib/firebase";
import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
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

const PALETTE = [
  { hex: "#2D1F3D", accent: "#B39DFF", name: "Violet" },
  { hex: "#1A2A1A", accent: "#6FCF97", name: "Emerald" },
  { hex: "#1F2535", accent: "#64B5F6", name: "Ocean" },
  { hex: "#2A1A1A", accent: "#FF8A80", name: "Ruby" },
  { hex: "#2A2012", accent: "#FFD580", name: "Amber" },
  { hex: "#1A2428", accent: "#80DEEA", name: "Teal" },
  { hex: "#251A2A", accent: "#F48FB1", name: "Blush" },
  { hex: "#1A1A1A", accent: "#BDBDBD", name: "Slate" },
];

interface Note {
  id: string;
  title: string;
  text: string;
  color: string;
  colorName: string;
  timestamp: number;
  updatedAt: number;
  pinned: boolean;
  userId: string;
}

export default function ExploreScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notes"),
      where("userId", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotes(snap.docs.map((d) => d.data() as Note));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut(auth);
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalNotes = notes.length;
  const pinnedCount = notes.filter((n) => n.pinned).length;
  const totalWords = notes.reduce(
    (acc, n) => acc + (n.text + " " + n.title).split(/\s+/).filter(Boolean).length,
    0
  );

  // Color distribution
  const colorStats = PALETTE.map((p) => ({
    ...p,
    count: notes.filter((n) => n.color === p.hex).length,
  })).filter((c) => c.count > 0);

  // Most recent note
  const recentNote = [...notes].sort((a, b) => b.updatedAt - a.updatedAt)[0];

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={DARK.bg} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              👋 {user?.displayName?.split(" ")[0] || "Hey there"}
            </Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* ── STATS GRID ── */}
        <Text style={styles.sectionLabel}>YOUR STATS</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderColor: DARK.accent }]}>
            <Text style={styles.statValue}>{totalNotes}</Text>
            <Text style={styles.statLabel}>Total Notes</Text>
          </View>
          <View style={[styles.statCard, { borderColor: "#F48FB1" }]}>
            <Text style={[styles.statValue, { color: "#F48FB1" }]}>{pinnedCount}</Text>
            <Text style={styles.statLabel}>Pinned</Text>
          </View>
          <View style={[styles.statCard, { borderColor: DARK.success }]}>
            <Text style={[styles.statValue, { color: DARK.success }]}>{totalWords}</Text>
            <Text style={styles.statLabel}>Words Written</Text>
          </View>
        </View>

        {/* ── MOST RECENT ── */}
        {recentNote && (
          <>
            <Text style={styles.sectionLabel}>LAST EDITED</Text>
            <View style={[styles.recentCard, { backgroundColor: recentNote.color }]}>
              <View
                style={[
                  styles.recentAccent,
                  {
                    backgroundColor:
                      PALETTE.find((p) => p.hex === recentNote.color)?.accent ??
                      DARK.accent,
                  },
                ]}
              />
              <View style={{ padding: 16 }}>
                <Text
                  style={[
                    styles.recentTitle,
                    {
                      color:
                        PALETTE.find((p) => p.hex === recentNote.color)?.accent ??
                        DARK.accent,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {recentNote.title || "Untitled"}
                </Text>
                <Text style={styles.recentText} numberOfLines={3}>
                  {recentNote.text}
                </Text>
                <Text style={styles.recentDate}>
                  {formatDate(recentNote.updatedAt)}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* ── COLOR USAGE ── */}
        {colorStats.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>NOTE COLORS</Text>
            <View style={styles.colorList}>
              {colorStats.map((c) => (
                <View key={c.hex} style={styles.colorRow}>
                  <View style={[styles.colorDot, { backgroundColor: c.accent }]} />
                  <Text style={styles.colorName}>{c.name}</Text>
                  <View style={styles.colorBarBg}>
                    <View
                      style={[
                        styles.colorBarFill,
                        {
                          backgroundColor: c.accent,
                          width: `${Math.round((c.count / totalNotes) * 100)}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.colorCount}>{c.count}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── EMPTY STATE ── */}
        {!loading && totalNotes === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyGlyph}>📝</Text>
            <Text style={styles.emptyTitle}>No notes yet</Text>
            <Text style={styles.emptySub}>
              Go to the Notes tab and create your first note!
            </Text>
          </View>
        )}

        {/* ── ACCOUNT INFO ── */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.accountCard}>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Name</Text>
            <Text style={styles.accountValue}>
              {user?.displayName || "—"}
            </Text>
          </View>
          <View style={[styles.accountRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.accountLabel}>Email</Text>
            <Text style={styles.accountValue} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
        </View>

        {/* Sign out bottom button */}
        <TouchableOpacity style={styles.signOutFullBtn} onPress={handleSignOut}>
          <Text style={styles.signOutFullText}>🚪 Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DARK.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 48 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  greeting: { fontSize: 22, fontWeight: "800", color: DARK.text, letterSpacing: -0.5 },
  email: { fontSize: 13, color: DARK.textMuted, marginTop: 2 },
  signOutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,90,90,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,90,90,0.25)",
  },
  signOutText: { fontSize: 13, fontWeight: "700", color: DARK.danger },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: DARK.textMuted,
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 8,
  },

  statsGrid: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: DARK.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "900",
    color: DARK.accent,
    letterSpacing: -1,
  },
  statLabel: { fontSize: 11, color: DARK.textMuted, marginTop: 4, fontWeight: "600" },

  recentCard: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  recentAccent: { height: 3, width: "100%" },
  recentTitle: { fontSize: 16, fontWeight: "800", marginBottom: 6, letterSpacing: -0.3 },
  recentText: { fontSize: 13, color: "rgba(240,239,248,0.65)", lineHeight: 19, marginBottom: 10 },
  recentDate: { fontSize: 11, color: "rgba(240,239,248,0.3)", letterSpacing: 0.3 },

  colorList: { marginBottom: 24, gap: 10 },
  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  colorName: { fontSize: 13, color: DARK.textSub, width: 58, fontWeight: "600" },
  colorBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: DARK.surface,
    borderRadius: 3,
    overflow: "hidden",
  },
  colorBarFill: { height: "100%", borderRadius: 3 },
  colorCount: { fontSize: 12, color: DARK.textMuted, width: 20, textAlign: "right" },

  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyGlyph: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: DARK.textSub, marginBottom: 8 },
  emptySub: { fontSize: 14, color: DARK.textMuted, textAlign: "center", lineHeight: 20 },

  accountCard: {
    backgroundColor: DARK.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DARK.border,
    marginBottom: 20,
    overflow: "hidden",
  },
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: DARK.border,
  },
  accountLabel: { fontSize: 13, color: DARK.textMuted, fontWeight: "600" },
  accountValue: { fontSize: 13, color: DARK.text, fontWeight: "700", maxWidth: "65%" },

  signOutFullBtn: {
    backgroundColor: "rgba(255,90,90,0.1)",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,90,90,0.2)",
  },
  signOutFullText: { fontSize: 15, fontWeight: "700", color: DARK.danger },
});
