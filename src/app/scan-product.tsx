import { useAudioPlayer } from "expo-audio";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ScanProductScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const player = useAudioPlayer(require("../../assets/sounds/beep.wav"));

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#111827" />
        <Text style={styles.loadingText}>Preparing scanner...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionIcon}>
          <Text style={styles.permissionIconText}>▣</Text>
        </View>

        <Text style={styles.permissionTitle}>Camera Access Required</Text>

        <Text style={styles.permissionDescription}>
          Allow camera access to scan product barcodes and quickly add products
          to your inventory.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={requestPermission}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Allow Camera Access</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;

    setScanned(true);

    player.seekTo(0);
    player.play();

    setTimeout(() => {
      router.dismissTo({
        pathname: "/add-product",
        params: {
          barcode: data,
        },
      });
    }, 500);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "code128", "code39", "qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {/* Dark overlay */}
      <View pointerEvents="none" style={styles.overlay} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Scan Product</Text>

          <Text style={styles.headerSubtitle}>Scan a barcode to continue</Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      {/* Scanner frame */}
      <View style={styles.scannerArea}>
        <View style={styles.scannerFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {!scanned && <View style={styles.scanLine} />}
        </View>

        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>
            {scanned ? "Barcode detected" : "Position barcode inside the frame"}
          </Text>

          <Text style={styles.instructionText}>
            {scanned
              ? "Opening product details..."
              : "Keep the barcode steady and make sure it is clearly visible."}
          </Text>
        </View>
      </View>

      {/* Bottom information */}
      <View style={styles.bottomPanel}>
        <View style={styles.statusRow}>
          <View
            style={[styles.statusDot, scanned && styles.statusDotSuccess]}
          />

          <Text style={styles.statusText}>
            {scanned ? "Barcode scanned successfully" : "Scanner ready"}
          </Text>
        </View>

        <Text style={styles.supportedText}>
          Supports EAN-13, EAN-8, Code 128, Code 39 and QR
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },

  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.28)",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#6B7280",
  },

  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#F8FAFC",
  },

  permissionIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#E8EEF7",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 22,
  },

  permissionIconText: {
    fontSize: 32,
    color: "#1F2937",
    fontWeight: "700",
  },

  permissionTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 10,
  },

  permissionDescription: {
    fontSize: 15,
    lineHeight: 23,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 30,
  },

  primaryButton: {
    backgroundColor: "#111827",
    paddingVertical: 16,
    borderRadius: 13,
    marginBottom: 12,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },

  secondaryButton: {
    paddingVertical: 15,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },

  secondaryButtonText: {
    color: "#374151",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },

  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 55,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    justifyContent: "center",
    alignItems: "center",
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "300",
    marginTop: -3,
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    marginTop: 3,
  },

  headerSpacer: {
    width: 44,
  },

  scannerArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },

  scannerFrame: {
    width: 285,
    height: 190,
    position: "relative",
  },

  corner: {
    position: "absolute",
    width: 34,
    height: 34,
    borderColor: "#FFFFFF",
  },

  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },

  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },

  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },

  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },

  scanLine: {
    position: "absolute",
    left: 10,
    right: 10,
    top: "50%",
    height: 2,
    backgroundColor: "#FFFFFF",
    opacity: 0.85,
  },

  instructionCard: {
    width: "82%",
    marginTop: 32,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "rgba(17,24,39,0.78)",
    alignItems: "center",
  },

  instructionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },

  instructionText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 6,
  },

  bottomPanel: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 28,
    backgroundColor: "rgba(17,24,39,0.82)",
    borderRadius: 18,
    padding: 17,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
    marginRight: 9,
  },

  statusDotSuccess: {
    backgroundColor: "#FFFFFF",
  },

  statusText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  supportedText: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 11,
    marginTop: 8,
  },
});
