import { ReactNode } from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";

type AlertType = "success" | "error" | "warning" | "info" | "confirm";

type AppAlertProps = {
  visible: boolean;
  type?: AlertType;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  children?: ReactNode;
};

const typeConfig = {
  success: {
    icon: "✓",
    iconBackground: "#E8F2EC",
    iconColor: "#527A63",
  },
  error: {
    icon: "!",
    iconBackground: "#F5E8E8",
    iconColor: "#A85454",
  },
  warning: {
    icon: "!",
    iconBackground: "#F5EFE2",
    iconColor: "#92713D",
  },
  info: {
    icon: "i",
    iconBackground: "#E7EEF1",
    iconColor: "#496875",
  },
  confirm: {
    icon: "?",
    iconBackground: "#E7EEF1",
    iconColor: "#496875",
  },
};

export default function AppAlert({
  visible,
  type = "info",
  title,
  message,
  confirmText = "Done",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  children,
}: AppAlertProps) {
  const config = typeConfig[type];

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onConfirm();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(20, 25, 30, 0.38)",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Pressable
          onPress={handleCancel}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
          }}
        />

        <View
          style={{
            width: "100%",
            maxWidth: 380,
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            padding: 24,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 10,
            },
            shadowOpacity: 0.12,
            shadowRadius: 25,
            elevation: 10,
          }}
        >
          {/* Icon */}
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: config.iconBackground,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <Text
              style={{
                fontSize: 23,
                fontWeight: "800",
                color: config.iconColor,
              }}
            >
              {config.icon}
            </Text>
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              color: "#1F2933",
              marginBottom: 8,
            }}
          >
            {title}
          </Text>

          {/* Message */}
          {message ? (
            <Text
              style={{
                fontSize: 15,
                lineHeight: 22,
                color: "#68727D",
                marginBottom: children ? 15 : 24,
              }}
            >
              {message}
            </Text>
          ) : null}

          {children}

          {/* Buttons */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              alignItems: "center",
              marginTop: children ? 10 : 0,
              gap: 10,
            }}
          >
            {onCancel && (
              <TouchableOpacity
                onPress={onCancel}
                activeOpacity={0.75}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 11,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#E2DED6",
                  backgroundColor: "#FAF9F6",
                }}
              >
                <Text
                  style={{
                    color: "#4B5563",
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={onConfirm}
              activeOpacity={0.8}
              style={{
                paddingHorizontal: 18,
                paddingVertical: 11,
                borderRadius: 10,
                backgroundColor:
                  type === "error" || type === "warning"
                    ? "#A85454"
                    : "#496875",
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
