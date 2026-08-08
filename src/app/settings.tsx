import { getSettings, saveSettings } from "@/database/db";
import { syncEverything } from "@/lib/sync";
import { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity } from "react-native";

export default function SettingsScreen() {
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gst, setGst] = useState("");
  const [upi, setUpi] = useState("");
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "warning">(
    "success",
  );

  useEffect(() => {
    const data: any = getSettings();

    if (data) {
      setShopName(data.shop_name || "");
      setOwnerName(data.owner_name || "");
      setPhone(data.phone || "");
      setAddress(data.address || "");
      setGst(data.gst || "");
      setUpi(data.upi || "");
    }
  }, []);

  const handleSave = async () => {
    if (shopName.trim() === "") {
      setAlertTitle("Missing Shop Name");
      setAlertMessage("Please enter your shop name.");
      setAlertType("warning");
      setAlertVisible(true);
      return;
    }

    console.log("========================================");
    console.log("Saving shop settings locally...");

    const success = saveSettings(
      shopName.trim(),
      ownerName.trim(),
      phone.trim(),
      address.trim(),
      gst.trim(),
      upi.trim(),
    );

    if (!success) {
      console.log("ERROR: Unable to save shop settings locally.");

      setAlertTitle("Save Failed");
      setAlertMessage("Unable to save settings.");
      setAlertType("error");
      setAlertVisible(true);

      return;
    }

    console.log("Shop settings saved locally.");
    console.log("Settings are now marked as pending sync.");

    // ---------------------------------------------
    // Sync local settings to Supabase
    // ---------------------------------------------

    try {
      console.log("Starting settings cloud synchronization...");

      const syncResult = await syncEverything();

      console.log("Settings cloud synchronization result:");
      console.log(syncResult);

      if (syncResult.settingsUploaded) {
        console.log("Shop settings successfully uploaded to Supabase.");
      } else {
        console.log("Shop settings were not uploaded during this sync.");

        console.log("Settings remain safely stored locally.");
      }
    } catch (error) {
      console.log("Settings cloud synchronization error:", error);

      // Do not remove or undo the local settings.
      // They remain in SQLite and can be synchronized later.
    }

    console.log("Shop settings save process completed.");
    console.log("========================================");

    setAlertTitle("Settings Saved");
    setAlertMessage("Shop settings saved successfully.");
    setAlertType("success");
    setAlertVisible(true);
  };

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: "#F5F5F5",
      }}
      contentContainerStyle={{
        padding: 20,
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
          marginBottom: 25,
        }}
      >
        Shop Settings
      </Text>

      <TextInput
        placeholder="Shop Name *"
        placeholderTextColor="#6B7280"
        value={shopName}
        onChangeText={setShopName}
        style={styles.input}
      />

      <TextInput
        placeholder="Owner Name"
        placeholderTextColor="#6B7280"
        value={ownerName}
        onChangeText={setOwnerName}
        style={styles.input}
      />

      <TextInput
        placeholder="Phone Number"
        placeholderTextColor="#6B7280"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        style={styles.input}
      />

      <TextInput
        placeholder="Shop Address"
        placeholderTextColor="#6B7280"
        multiline
        value={address}
        onChangeText={setAddress}
        style={[
          styles.input,
          {
            height: 90,
          },
        ]}
      />

      <TextInput
        placeholder="GST Number (Optional)"
        placeholderTextColor="#6B7280"
        value={gst}
        onChangeText={setGst}
        style={styles.input}
      />

      <TextInput
        placeholder="UPI ID (Optional)"
        placeholderTextColor="#6B7280"
        value={upi}
        onChangeText={setUpi}
        style={styles.input}
      />

      <TouchableOpacity
        onPress={handleSave}
        style={{
          backgroundColor: "#007AFF",
          padding: 16,
          borderRadius: 10,
          marginTop: 10,
        }}
      >
        <Text
          style={{
            color: "white",
            textAlign: "center",
            fontWeight: "bold",
            fontSize: 18,
          }}
        >
          Save Settings
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = {
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    padding: 14,
    marginBottom: 15,
    fontSize: 16,
  },
};
