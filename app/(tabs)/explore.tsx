import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { StyleSheet } from "react-native";

export default function ExploreScreen() {
  return (
    <ThemedView style={styles.container}>
      <IconSymbol name="sparkles" size={60} color="#888" />
      <ThemedText type="title" style={styles.title}>
        Notes App Features
      </ThemedText>
      <ThemedView style={styles.featureList}>
        <ThemedView style={styles.featureItem}>
          <IconSymbol name="checkmark.circle.fill" size={24} color="#4CAF50" />
          <ThemedText style={styles.featureText}>
            Add notes with colors
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.featureItem}>
          <IconSymbol name="checkmark.circle.fill" size={24} color="#4CAF50" />
          <ThemedText style={styles.featureText}>
            Delete notes (long press)
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.featureItem}>
          <IconSymbol name="checkmark.circle.fill" size={24} color="#4CAF50" />
          <ThemedText style={styles.featureText}>
            Auto-save with AsyncStorage
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.featureItem}>
          <IconSymbol name="checkmark.circle.fill" size={24} color="#4CAF50" />
          <ThemedText style={styles.featureText}>
            Color tags for notes
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.featureItem}>
          <IconSymbol name="checkmark.circle.fill" size={24} color="#4CAF50" />
          <ThemedText style={styles.featureText}>
            Search bar to find notes
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
  },
  title: {
    marginTop: 20,
    marginBottom: 30,
  },
  featureList: {
    width: "100%",
    gap: 15,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
  },
  featureText: {
    fontSize: 16,
    color: "#333",
  },
});
