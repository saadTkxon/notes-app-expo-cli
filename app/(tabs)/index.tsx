import AsyncStorage from "@react-native-async-storage/async-storage";
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

const STORAGE_KEY = "notes_v3";

export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "pinned">(
    "newest",
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const fabScale = useRef(new Animated.Value(0)).current;
  const fabRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadNotes();
    Animated.spring(fabScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 70,
      friction: 6,
    }).start();
  }, []);

  useEffect(() => {
    saveNotes();
  }, [notes]);

  const animateFabOpen = (open: boolean) => {
    Animated.spring(fabRotate, {
      toValue: open ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
    }).start();
  };

  const loadNotes = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) setNotes(JSON.parse(data));
    } catch (e) {
      console.error("Load error:", e);
    }
  };

  const saveNotes = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error("Save error:", e);
    }
  };

  const openAddModal = () => {
    setEditingNote(null);
    setNoteTitle("");
    setNoteText("");
    setSelectedColor(PALETTE[0]);
    animateFabOpen(true);
    setModalVisible(true);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteText(note.text);
    setSelectedColor(PALETTE.find((p) => p.hex === note.color) || PALETTE[0]);
    setModalVisible(true);
  };

  const saveNote = () => {
    if (!noteText.trim() && !noteTitle.trim()) return;

    if (editingNote) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingNote.id
            ? {
                ...n,
                title: noteTitle.trim(),
                text: noteText.trim(),
                color: selectedColor.hex,
                colorName: selectedColor.name,
                updatedAt: Date.now(),
              }
            : n,
        ),
      );
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
      };
      setNotes((prev) => [newNote, ...prev]);
    }
    closeModal();
  };

  const closeModal = () => {
    animateFabOpen(false);
    setModalVisible(false);
    setEditingNote(null);
    setNoteTitle("");
    setNoteText("");
    setSelectedColor(PALETTE[0]);
  };

  const deleteNote = (id: string) => {
    Alert.alert(
      "Note Delete Karo",
      "Kya aap wakai yeh note delete karna chahte hain?",
      [
        { text: "Nahi", style: "cancel" },
        {
          text: "Haan, Delete",
          style: "destructive",
          onPress: () => {
            setNotes((prev) => prev.filter((n) => n.id !== id));
            if (editingNote?.id === id) closeModal();
          },
        },
      ],
      { cancelable: true },
    );
  };

  const togglePin = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)),
    );
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Abhi abhi";
    if (mins < 60) return `${mins}m`;
    if (hrs < 24) return `${hrs}h`;
    if (days < 7) return `${days}d`;
    return new Date(ts).toLocaleDateString();
  };

  const getSortedNotes = () => {
    let filtered = notes.filter(
      (n) =>
        n.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    if (sortBy === "newest") filtered.sort((a, b) => b.updatedAt - a.updatedAt);
    else if (sortBy === "oldest")
      filtered.sort((a, b) => a.timestamp - b.timestamp);
    else filtered.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    return filtered;
  };

  const filteredNotes = getSortedNotes();
  const pinnedCount = notes.filter((n) => n.pinned).length;

  const fabRotateInterp = fabRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const getNoteAccent = (note: Note) =>
    PALETTE.find((p) => p.hex === note.color)?.accent ?? "#B39DFF";

  const renderGridNote = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={[styles.gridCard, { backgroundColor: item.color }]}
      onPress={() => openEditModal(item)}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.cardAccentLine,
          { backgroundColor: getNoteAccent(item) },
        ]}
      />
      {item.pinned && (
        <View style={styles.pinBadge}>
          <Text style={[styles.pinDot, { color: getNoteAccent(item) }]}>●</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        {item.title ? (
          <Text
            style={[styles.cardTitle, { color: getNoteAccent(item) }]}
            numberOfLines={1}
          >
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
          onPress={() => deleteNote(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.cardDeleteIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderListNote = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={[styles.listCard, { borderLeftColor: getNoteAccent(item) }]}
      onPress={() => openEditModal(item)}
      activeOpacity={0.8}
    >
      <View style={styles.listCardInner}>
        <View style={{ flex: 1 }}>
          <View style={styles.listTitleRow}>
            {item.pinned && (
              <Text style={[styles.listPinDot, { color: getNoteAccent(item) }]}>
                ●{" "}
              </Text>
            )}
            <Text
              style={[styles.listCardTitle, { color: getNoteAccent(item) }]}
              numberOfLines={1}
            >
              {item.title || item.text.substring(0, 40)}
            </Text>
          </View>
          {item.title ? (
            <Text style={styles.listCardText} numberOfLines={2}>
              {item.text}
            </Text>
          ) : null}
          <Text style={styles.listCardTime}>
            {formatTime(item.updatedAt)} ago
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => deleteNote(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.listDeleteBtn}
        >
          <Text style={styles.cardDeleteIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
            {pinnedCount > 0 ? `  ·  ${pinnedCount} pinned` : ""}
          </Text>
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

      {/* ── SEARCH ── */}
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

      {/* ── SORT PILLS ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortRow}
      >
        {(["newest", "oldest", "pinned"] as const).map((s) => (
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
              {s === "newest"
                ? "Newest"
                : s === "oldest"
                  ? "Oldest"
                  : "⭐ Pinned"}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.divider} />

      {/* ── NOTES ── */}
      <FlatList
        key={viewMode}
        data={filteredNotes}
        renderItem={viewMode === "grid" ? renderGridNote : renderListNote}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === "grid" ? 2 : 1}
        columnWrapperStyle={
          viewMode === "grid" ? styles.columnWrapper : undefined
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          filteredNotes.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={
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
        }
      />

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

      {/* ── MODAL ── */}
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

              {/* Action Buttons */}
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
                    {editingNote ? "Update" : "Save Note"}
                  </Text>
                </TouchableOpacity>
              </View>

              {editingNote && (
                <Text style={styles.editMeta}>
                  Created {new Date(editingNote.timestamp).toLocaleDateString()}
                  {"  ·  "}
                  Edited {formatTime(editingNote.updatedAt)} ago
                </Text>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DARK.bg,
  },

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
  appSub: {
    fontSize: 13,
    color: DARK.textSub,
    marginTop: 3,
    letterSpacing: 0.2,
  },
  viewToggleBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: DARK.surfaceHigh,
    borderWidth: 1,
    borderColor: DARK.border,
    justifyContent: "center",
    alignItems: "center",
  },
  viewToggleText: {
    fontSize: 20,
    color: DARK.textSub,
  },

  // Search
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: DARK.surface,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 12,
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
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: DARK.text,
    padding: 0,
  },
  clearBtn: {
    fontSize: 13,
    color: DARK.textSub,
    paddingLeft: 8,
  },

  // Sort Pills
  sortRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: "center",
  },
  sortPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: DARK.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: DARK.border,
  },
  sortPillActive: {
    backgroundColor: DARK.accentDim,
    borderColor: DARK.accent,
  },
  sortPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: DARK.textSub,
  },
  sortPillTextActive: {
    color: DARK.accent,
  },

  divider: {
    height: 1,
    backgroundColor: DARK.border,
    marginHorizontal: 16,
    marginBottom: 14,
  },

  // Grid
  columnWrapper: {
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  listContent: {
    paddingBottom: 110,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  gridCard: {
    width: CARD_WIDTH,
    minHeight: 145,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  cardAccentLine: {
    height: 3,
    width: "100%",
    opacity: 0.8,
  },
  pinBadge: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  pinDot: {
    fontSize: 8,
  },
  cardBody: {
    padding: 12,
    paddingTop: 10,
    flex: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 5,
    letterSpacing: 0.1,
  },
  cardText: {
    fontSize: 12.5,
    color: "rgba(240,239,248,0.72)",
    lineHeight: 18,
  },
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
  cardDeleteIcon: {
    fontSize: 11,
    color: "rgba(240,239,248,0.3)",
  },

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
  listTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  listPinDot: {
    fontSize: 8,
    marginRight: 4,
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
  listCardTime: {
    fontSize: 11,
    color: DARK.textMuted,
    marginTop: 6,
  },
  listDeleteBtn: {
    paddingLeft: 16,
    paddingVertical: 4,
  },

  // Empty
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  emptyGlyph: {
    fontSize: 72,
    color: DARK.border,
    marginBottom: 20,
  },
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
  fabWrapper: {
    position: "absolute",
    bottom: 32,
    right: 22,
  },
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
  modalHeading: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  modalHeaderActions: {
    flexDirection: "row",
    gap: 6,
  },
  modalIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
  modalIconBtnDanger: {
    backgroundColor: "rgba(255,90,90,0.15)",
  },
  modalIconBtnText: {
    fontSize: 15,
  },
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
  colorSection: {
    marginBottom: 22,
  },
  colorSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: DARK.textMuted,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  colorRow: {
    flexDirection: "row",
    gap: 10,
  },
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
  colorChipSelected: {
    opacity: 1,
    transform: [{ scale: 1.15 }],
  },
  colorChipCheck: {
    fontSize: 16,
    fontWeight: "800",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 6,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: DARK.textSub,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  saveBtnDisabled: {
    opacity: 0.3,
  },
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
