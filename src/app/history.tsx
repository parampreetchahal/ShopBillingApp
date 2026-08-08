import { getBills } from "@/database/db";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function HistoryScreen() {
  const [bills, setBills] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const loadBills = () => {
    const data = getBills();
    setBills(data as any[]);
  };

  useFocusEffect(
    useCallback(() => {
      loadBills();
    }, []),
  );

  const filteredBills = bills.filter((item) => {
    const query = search.toLowerCase().trim();

    return (
      item.invoice_number.toLowerCase().includes(query) ||
      item.customer_name.toLowerCase().includes(query) ||
      (item.mobile ?? "").toLowerCase().includes(query)
    );
  });

  const renderInvoice = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() =>
        router.push({
          pathname: "/invoice-details",
          params: {
            billId: item.id,
          },
        })
      }
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 17,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E8E5DF",
      }}
    >
      {/* Top row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={{ flex: 1, paddingRight: 15 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "800",
              color: "#20282D",
              marginBottom: 6,
            }}
          >
            {item.invoice_number}
          </Text>

          <Text
            style={{
              fontSize: 14,
              color: "#59636A",
              fontWeight: "600",
            }}
            numberOfLines={1}
          >
            {item.customer_name || "Walk-in Customer"}
          </Text>
        </View>

        <View
          style={{
            alignItems: "flex-end",
          }}
        >
          <Text
            style={{
              fontSize: 11,
              color: "#8A9195",
              marginBottom: 3,
            }}
          >
            TOTAL
          </Text>

          <Text
            style={{
              fontSize: 18,
              fontWeight: "800",
              color: "#344F5A",
            }}
          >
            ₹{item.total}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View
        style={{
          height: 1,
          backgroundColor: "#F0EEE9",
          marginVertical: 14,
        }}
      />

      {/* Details */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 12,
              color: "#8A9195",
              marginBottom: 4,
            }}
          >
            DATE & TIME
          </Text>

          <Text
            style={{
              fontSize: 13,
              color: "#59636A",
              fontWeight: "600",
            }}
          >
            {item.date} · {item.time}
          </Text>
        </View>

        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: "#EEF2F2",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 17,
              color: "#496875",
              marginTop: -1,
            }}
          >
            ›
          </Text>
        </View>
      </View>

      {item.mobile ? (
        <Text
          style={{
            marginTop: 10,
            fontSize: 12,
            color: "#8A9195",
          }}
        >
          {item.mobile}
        </Text>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#F7F6F2",
      }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 16,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: "#8A9195",
            fontWeight: "600",
            letterSpacing: 1,
            textTransform: "uppercase",
            marginBottom: 5,
          }}
        >
          Transactions
        </Text>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "800",
                color: "#20282D",
              }}
            >
              Invoice History
            </Text>

            <Text
              style={{
                marginTop: 6,
                fontSize: 14,
                color: "#7B848A",
              }}
            >
              Your recent transactions
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "#E9F0F1",
              borderRadius: 10,
              paddingHorizontal: 11,
              paddingVertical: 7,
            }}
          >
            <Text
              style={{
                color: "#496875",
                fontSize: 13,
                fontWeight: "700",
              }}
            >
              {bills.length} {bills.length === 1 ? "bill" : "bills"}
            </Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View
        style={{
          paddingHorizontal: 20,
          marginBottom: 14,
        }}
      >
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 13,
            borderWidth: 1,
            borderColor: "#E5E1DA",
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 14,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              color: "#8A9195",
              marginRight: 8,
            }}
          >
            ⌕
          </Text>

          <TextInput
            placeholder="Search invoice, customer or mobile"
            placeholderTextColor="#9AA0A4"
            value={search}
            onChangeText={setSearch}
            style={{
              flex: 1,
              height: 48,
              color: "#20282D",
              fontSize: 14,
            }}
          />
        </View>
      </View>

      {/* Invoice list */}
      <FlatList
        data={filteredBills}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderInvoice}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 2,
          paddingBottom: 30,
          flexGrow: filteredBills.length === 0 ? 1 : undefined,
        }}
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 30,
              paddingBottom: 80,
            }}
          >
            <View
              style={{
                width: 58,
                height: 58,
                borderRadius: 29,
                backgroundColor: "#E9F0F1",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 15,
              }}
            >
              <Text
                style={{
                  fontSize: 25,
                  color: "#496875",
                }}
              >
                ▤
              </Text>
            </View>

            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                color: "#303A40",
                marginBottom: 6,
              }}
            >
              {search.trim() ? "No invoices found" : "No invoices yet"}
            </Text>

            <Text
              style={{
                textAlign: "center",
                color: "#7B848A",
                fontSize: 14,
                lineHeight: 21,
              }}
            >
              {search.trim()
                ? "Try another invoice number, customer name or mobile number."
                : "Your completed bills will appear here."}
            </Text>
          </View>
        }
      />
    </View>
  );
}
