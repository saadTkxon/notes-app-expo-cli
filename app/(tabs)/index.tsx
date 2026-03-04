// app/(tabs)/index.tsx
import { auth, db } from "@/lib/firebase";
import { router } from "expo-router";
import { signOut } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
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

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = (width - 52) / 2;

// ─── DARK THEME TOKENS ───────────────────────────────────────────────────────
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
  white: "#FFFFFF",
};

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

const NOTES_COLLECTION = "notes";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const getNoteAccent = (note: Note) =>
  PALETTE.find((p) => p.hex === note.color)?.accent ?? "#B39DFF";

const formatTime = (ts: number) => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
};

// ─── PINNED CARD (horizontal scroll) ─────────────────────────────────────────
function PinnedCard({
  item,
  onPress,
  onDelete,
}: {
  item: Note;
  onPress: () => void;
  onDelete: () => void;
}) {
  const accent = getNoteAccent(item);
  return (
    <TouchableOpacity
      style={[styles.pinnedCard, { backgroundColor: item.color }]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={[styles.pinnedAccentLine, { backgroundColor: accent }]} />
      <View style={styles.pinnedCardBody}>
        <View style={styles.pinnedCardTop}>
          <Text
            style={[styles.pinnedCardTitle, { color: accent }]}
            numberOfLines={1}
          >
            {item.title || item.text.substring(0, 28)}
          </Text>
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.pinnedDeleteIcon}>✕</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.pinnedCardText} numberOfLines={3}>
          {item.text}
        </Text>
        <Text style={styles.pinnedCardTime}>{formatTime(item.updatedAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── GRID CARD ────────────────────────────────────────────────────────────────
function GridCard({
  item,
  onPress,
  onDelete,
}: {
  item: Note;
  onPress: () => void;
  onDelete: () => void;
}) {
  const accent = getNoteAccent(item);
  return (
    <TouchableOpacity
      style={[styles.gridCard, { backgroundColor: item.color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.cardAccentLine, { backgroundColor: accent }]} />
      <View style={styles.cardBody}>
        {item.title ? (
          <Text style={[styles.cardTitle, { color: accent }]} numberOfLines={1}>
            {item.title}
          </Text>
        ) : null}
        <Text style={styles.cardText} numberOfLines={5}>
          {item.text}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.cardTime}>{formatTime(item.updatedAt)}</Text>
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.cardDeleteIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── LIST CARD ────────────────────────────────────────────────────────────────
function ListCard({
  item,
  onPress,
  onDelete,
}: {
  item: Note;
  onPress: () => void;
  onDelete: () => void;
}) {
  const accent = getNoteAccent(item);
  return (
    <TouchableOpacity
      style={[styles.listCard, { borderLeftColor: accent }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.listCardInner}>
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.listCardTitle, { color: accent }]}
            numberOfLines={1}
          >
            {item.title || item.text.substring(0, 40)}
          </Text>
          {item.title ? (
            <Text style={styles.listCardText} numberOfLines={2}>
              {item.text}
            </Text>
          ) : null}
          <Text style={styles.listCardTime}>{formatTime(item.updatedAt)}</Text>
        </View>
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.listDeleteBtn}
        >
          <Text style={styles.cardDeleteIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const fabScale = useRef(new Animated.Value(0)).current;
  const fabRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsub = loadNotes();
    Animated.spring(fabScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 70,
      friction: 6,
    }).start();
    return () => { if (unsub) unsub(); };
  }, []);

  const animateFab = (open: boolean) =>
    Animated.spring(fabRotate, {
      toValue: open ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
    }).start();

  // Firestore realtime listener
  const loadNotes = () => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(collection(db, NOTES_COLLECTION), where("userId", "==", user.uid));
    return onSnapshot(q, (snapshot) => {
      setNotes(snapshot.docs.map((d) => d.data() as Note));
    });
  };

  const saveNoteToFirestore = async (note: Note) => {
    try {
      await setDoc(doc(db, NOTES_COLLECTION, note.id), note);
    } catch (e) { console.error("Save error:", e); }
  };

  const deleteNoteFromFirestore = async (id: string) => {
    try {
      await deleteDoc(doc(db, NOTES_COLLECTION, id));
    } catch (e) { console.error("Delete error:", e); }
  };

  const openAddModal = () => {
    setEditingNote(null);
    setNoteTitle("");
    setNoteText("");
    setSelectedColor(PALETTE[0]);
    animateFab(true);
    setModalVisible(true);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteText(note.text);
    setSelectedColor(PALETTE.find((p) => p.hex === note.color) || PALETTE[0]);
    setModalVisible(true);
  };

  const saveNote = async () => {
    if (!noteText.trim() && !noteTitle.trim()) return;
    const user = auth.currentUser;
    if (!user) return;

    if (editingNote) {
      const updated = {
        ...editingNote,
        title: noteTitle.trim(),
        text: noteText.trim(),
        color: selectedColor.hex,
        colorName: selectedColor.name,
        updatedAt: Date.now(),
      };
      await saveNoteToFirestore(updated);
    } else {
      const newNote: Note = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: noteTitle.trim(),
        text: noteText.trim(),
        color: selectedColor.hex,
        colorName: selectedColor.name,
        timestamp: Date.now(),
        updatedAt: Date.now(),
        pinned: false,
        userId: user.uid,
      };
      await saveNoteToFirestore(newNote);
    }
    closeModal();
  };

  const closeModal = () => {
    animateFab(false);
    setModalVisible(false);
    setEditingNote(null);
    setNoteTitle("");
    setNoteText("");
    setSelectedColor(PALETTE[0]);
  };

  const deleteNote = (id: string) => {
    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this note?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteNoteFromFirestore(id);
            if (editingNote?.id === id) closeModal();
          },
        },
      ],
      { cancelable: true },
    );
  };

  const togglePin = async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    const updated = { ...note, pinned: !note.pinned };
    await saveNoteToFirestore(updated);
  };

  // ── Derived data
  const matchesSearch = (n: Note) =>
    n.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.title.toLowerCase().includes(searchQuery.toLowerCase());

  const allFiltered = notes.filter(matchesSearch);
  const pinnedNotes = allFiltered.filter((n) => n.pinned);
  const unpinnedNotes = allFiltered
    .filter((n) => !n.pinned)
    .sort((a, b) =>
      sortBy === "newest"
        ? b.updatedAt - a.updatedAt
        : a.timestamp - b.timestamp,
    );

  const fabRotateInterp = fabRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  // ── Render helpers
  const renderGridItem = ({ item }: { item: Note }) => (
    <GridCard
      item={item}
      onPress={() => openEditModal(item)}
      onDelete={() => deleteNote(item.id)}
    />
  );
  const renderListItem = ({ item }: { item: Note }) => (
    <ListCard
      item={item}
      onPress={() => openEditModal(item)}
      onDelete={() => deleteNote(item.id)}
    />
  );

  // ── List header: pinned section + search + sort
  const ListHeader = () => (
    <>
      {/* Search */}
      <View style={styles.searchWrapper}>
        <Text style={styles.searchIconText}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search notes..."
          placeholderTextColor={DARK.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          selectionColor={DARK.accent}
        />
        {searchQuery !== "" && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pinned Section */}
      {pinnedNotes.length > 0 && (
        <View style={styles.pinnedSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>📌 PINNED</Text>
            <Text style={styles.sectionCount}>{pinnedNotes.length}</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pinnedScroll}
          >
            {pinnedNotes.map((note) => (
              <PinnedCard
                key={note.id}
                item={note}
                onPress={() => openEditModal(note)}
                onDelete={() => deleteNote(note.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Sort + View Toggle row */}
      {unpinnedNotes.length > 0 && (
        <View style={styles.controlsRow}>
          <View style={styles.sortPills}>
            {(["newest", "oldest"] as const).map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.sortPill, sortBy === s && styles.sortPillActive]}
                onPress={() => setSortBy(s)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.sortPillText,
                    sortBy === s && styles.sortPillTextActive,
                  ]}
                >
                  {s === "newest" ? "Newest" : "Oldest"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.viewToggleBtn}
            onPress={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            activeOpacity={0.7}
          >
            <Text style={styles.viewToggleText}>
              {viewMode === "grid" ? "☰" : "⊞"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {unpinnedNotes.length > 0 && (
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>ALL NOTES</Text>
          <Text style={styles.sectionCount}>{unpinnedNotes.length}</Text>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={DARK.bg} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>Notes</Text>
          <Text style={styles.appSub}>
            {notes.length} {notes.length === 1 ? "note" : "notes"}
            {pinnedNotes.length > 0 && !searchQuery
              ? `  ·  ${pinnedNotes.length} pinned`
              : ""}
          </Text>
        </View>
        {/* Profile avatar placeholder */}
        <TouchableOpacity
          style={styles.avatarBtn}
          activeOpacity={0.8}
          onPress={() =>
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
            ])
          }
        >
          <Text style={styles.avatarText}>↪</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* ── NOTES LIST (with pinned section in header) ── */}
      {viewMode === "grid" ? (
        <FlatList
          key="grid"
          data={unpinnedNotes}
          renderItem={renderGridItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            unpinnedNotes.length === 0 &&
              pinnedNotes.length === 0 &&
              styles.listContentEmpty,
          ]}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={
            pinnedNotes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyGlyph}>✎</Text>
                <Text style={styles.emptyTitle}>
                  {searchQuery ? "No results found" : "No notes yet"}
                </Text>
                <Text style={styles.emptySub}>
                  {searchQuery
                    ? `Nothing matches "${searchQuery}"`
                    : "Tap + to write your first note"}
                </Text>
              </View>
            ) : null
          }
        />
      ) : (
        <FlatList
          key="list"
          data={unpinnedNotes}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            unpinnedNotes.length === 0 &&
              pinnedNotes.length === 0 &&
              styles.listContentEmpty,
          ]}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={
            pinnedNotes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyGlyph}>✎</Text>
                <Text style={styles.emptyTitle}>
                  {searchQuery ? "No results found" : "No notes yet"}
                </Text>
                <Text style={styles.emptySub}>
                  {searchQuery
                    ? `Nothing matches "${searchQuery}"`
                    : "Tap + to write your first note"}
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* ── FAB ── */}
      <Animated.View
        style={[styles.fabWrapper, { transform: [{ scale: fabScale }] }]}
      >
        <TouchableOpacity
          style={styles.fab}
          onPress={openAddModal}
          activeOpacity={0.85}
        >
          <Animated.Text
            style={[
              styles.fabIcon,
              { transform: [{ rotate: fabRotateInterp }] },
            ]}
          >
            +
          </Animated.Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── MODAL: ADD / EDIT ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalSheet,
                { backgroundColor: selectedColor.hex },
              ]}
            >
              <View style={styles.dragHandle} />

              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text
                  style={[styles.modalHeading, { color: selectedColor.accent }]}
                >
                  {editingNote ? "Edit Note" : "New Note"}
                </Text>
                <View style={styles.modalHeaderActions}>
                  {editingNote && (
                    <TouchableOpacity
                      onPress={() => togglePin(editingNote.id)}
                      style={styles.modalIconBtn}
                    >
                      <Text style={styles.modalIconBtnText}>
                        {editingNote.pinned ? "⭐" : "☆"}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {editingNote && (
                    <TouchableOpacity
                      onPress={() => deleteNote(editingNote.id)}
                      style={[styles.modalIconBtn, styles.modalIconBtnDanger]}
                    >
                      <Text style={styles.modalIconBtnText}>🗑</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={closeModal}
                    style={styles.modalIconBtn}
                  >
                    <Text style={styles.modalIconBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Title */}
              <TextInput
                style={[
                  styles.titleInput,
                  {
                    color: selectedColor.accent,
                    borderBottomColor: `${selectedColor.accent}33`,
                  },
                ]}
                placeholder="Title..."
                placeholderTextColor={DARK.textMuted}
                value={noteTitle}
                onChangeText={setNoteTitle}
                maxLength={80}
                selectionColor={selectedColor.accent}
              />

              {/* Body */}
              <TextInput
                style={styles.bodyInput}
                placeholder="Write your note here..."
                placeholderTextColor={DARK.textMuted}
                multiline
                numberOfLines={8}
                value={noteText}
                onChangeText={setNoteText}
                autoFocus={!editingNote}
                textAlignVertical="top"
                selectionColor={DARK.accent}
              />

              {/* Color Picker */}
              <View style={styles.colorSection}>
                <Text style={styles.colorSectionLabel}>COLOR</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.colorRow}>
                    {PALETTE.map((p) => (
                      <TouchableOpacity
                        key={p.hex}
                        onPress={() => setSelectedColor(p)}
                        style={[
                          styles.colorChip,
                          { backgroundColor: p.hex, borderColor: p.accent },
                          selectedColor.hex === p.hex &&
                            styles.colorChipSelected,
                        ]}
                        activeOpacity={0.8}
                      >
                        {selectedColor.hex === p.hex && (
                          <Text
                            style={[styles.colorChipCheck, { color: p.accent }]}
                          >
                            ✓
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={closeModal}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    { backgroundColor: selectedColor.accent },
                    !noteText.trim() &&
                      !noteTitle.trim() &&
                      styles.saveBtnDisabled,
                  ]}
                  onPress={saveNote}
                  disabled={!noteText.trim() && !noteTitle.trim()}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveBtnText}>
                    {editingNote ? "Update Note" : "Save Note"}
                  </Text>
                </TouchableOpacity>
              </View>

              {editingNote && (
                <Text style={styles.editMeta}>
                  Created {new Date(editingNote.timestamp).toLocaleDateString()}
                  {"  ·  "}Edited {formatTime(editingNote.updatedAt)}
                </Text>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DARK.bg },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  appTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: DARK.text,
    letterSpacing: -1,
  },
  appSub: { fontSize: 13, color: DARK.textSub, marginTop: 3 },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DARK.accentDim,
    borderWidth: 1,
    borderColor: DARK.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "800", color: DARK.accent },

  divider: {
    height: 1,
    backgroundColor: DARK.border,
    marginHorizontal: 16,
    marginBottom: 4,
  },

  // Search
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: DARK.surface,
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: DARK.border,
  },
  searchIconText: {
    fontSize: 20,
    color: DARK.textMuted,
    marginRight: 8,
    lineHeight: 22,
  },
  searchInput: { flex: 1, fontSize: 15, color: DARK.text, padding: 0 },
  clearBtn: { fontSize: 13, color: DARK.textSub, paddingLeft: 8 },

  // Pinned Section
  pinnedSection: { marginBottom: 6 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: DARK.textMuted,
    letterSpacing: 1.5,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: "700",
    color: DARK.textMuted,
    backgroundColor: DARK.surfaceHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  pinnedScroll: { paddingHorizontal: 16, gap: 12, paddingBottom: 4 },
  pinnedCard: {
    width: 180,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginRight: 4,
  },
  pinnedAccentLine: { height: 3, width: "100%", opacity: 0.9 },
  pinnedCardBody: { padding: 12 },
  pinnedCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  pinnedCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    letterSpacing: 0.1,
  },
  pinnedDeleteIcon: {
    fontSize: 11,
    color: "rgba(240,239,248,0.3)",
    paddingLeft: 8,
  },
  pinnedCardText: {
    fontSize: 12,
    color: "rgba(240,239,248,0.65)",
    lineHeight: 17,
    marginBottom: 8,
  },
  pinnedCardTime: {
    fontSize: 10,
    color: "rgba(240,239,248,0.3)",
    letterSpacing: 0.3,
  },

  // Controls Row
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 14,
    marginTop: 4,
  },
  sortPills: { flexDirection: "row", gap: 8 },
  sortPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: DARK.surface,
    borderWidth: 1,
    borderColor: DARK.border,
  },
  sortPillActive: { backgroundColor: DARK.accentDim, borderColor: DARK.accent },
  sortPillText: { fontSize: 13, fontWeight: "600", color: DARK.textSub },
  sortPillTextActive: { color: DARK.accent },
  viewToggleBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: DARK.surfaceHigh,
    borderWidth: 1,
    borderColor: DARK.border,
    justifyContent: "center",
    alignItems: "center",
  },
  viewToggleText: { fontSize: 18, color: DARK.textSub },

  // Grid
  columnWrapper: {
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  listContent: { paddingBottom: 110 },
  listContentEmpty: { flexGrow: 1 },
  gridCard: {
    width: CARD_WIDTH,
    minHeight: 145,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  cardAccentLine: { height: 3, width: "100%", opacity: 0.8 },
  cardBody: { padding: 12, paddingTop: 10, flex: 1 },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 5,
    letterSpacing: 0.1,
  },
  cardText: { fontSize: 12.5, color: "rgba(240,239,248,0.72)", lineHeight: 18 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  cardTime: {
    fontSize: 10,
    color: "rgba(240,239,248,0.35)",
    letterSpacing: 0.3,
  },
  cardDeleteIcon: { fontSize: 11, color: "rgba(240,239,248,0.3)" },

  // List
  listCard: {
    backgroundColor: DARK.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: DARK.border,
    overflow: "hidden",
  },
  listCardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    paddingLeft: 16,
  },
  listCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    letterSpacing: -0.2,
  },
  listCardText: {
    fontSize: 13,
    color: DARK.textSub,
    lineHeight: 18,
    marginTop: 4,
  },
  listCardTime: { fontSize: 11, color: DARK.textMuted, marginTop: 6 },
  listDeleteBtn: { paddingLeft: 16, paddingVertical: 4 },

  // Empty
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  emptyGlyph: { fontSize: 64, color: DARK.border, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: DARK.textSub,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptySub: {
    fontSize: 14,
    color: DARK.textMuted,
    textAlign: "center",
    paddingHorizontal: 48,
    lineHeight: 20,
  },

  // FAB
  fabWrapper: { position: "absolute", bottom: 32, right: 22 },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: DARK.accent,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: DARK.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  fabIcon: {
    fontSize: 32,
    color: DARK.white,
    lineHeight: 36,
    fontWeight: "300",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
    minHeight: height * 0.65,
    maxHeight: height * 0.93,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalHeading: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  modalHeaderActions: { flexDirection: "row", gap: 6 },
  modalIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
  modalIconBtnDanger: { backgroundColor: "rgba(255,90,90,0.15)" },
  modalIconBtnText: { fontSize: 15 },
  titleInput: {
    fontSize: 20,
    fontWeight: "700",
    borderBottomWidth: 1,
    paddingBottom: 12,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  bodyInput: {
    fontSize: 15,
    color: "rgba(240,239,248,0.8)",
    lineHeight: 23,
    minHeight: 130,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  colorSection: { marginBottom: 22 },
  colorSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: DARK.textMuted,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  colorRow: { flexDirection: "row", gap: 10 },
  colorChip: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    opacity: 0.7,
  },
  colorChipSelected: { opacity: 1, transform: [{ scale: 1.15 }] },
  colorChipCheck: { fontSize: 16, fontWeight: "800" },
  modalActions: { flexDirection: "row", gap: 12, marginBottom: 6 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "700", color: DARK.textSub },
  saveBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.3 },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0D0D0F",
    letterSpacing: 0.2,
  },
  editMeta: {
    fontSize: 11,
    color: "rgba(255,255,255,0.25)",
    textAlign: "center",
    marginTop: 12,
    letterSpacing: 0.3,
  },
});
