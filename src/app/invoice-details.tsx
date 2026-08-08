import { getBillById, getBillItems, getSettings } from "@/database/db";
import { router, useLocalSearchParams } from "expo-router";
import * as SMS from "expo-sms";
import { useEffect, useState } from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export default function InvoiceDetailsScreen() {
  const { billId } = useLocalSearchParams();

  const [bill, setBill] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!billId) return;

    const invoice = getBillById(Number(billId));
    const invoiceItems = getBillItems(Number(billId));

    setBill(invoice);
    setItems(invoiceItems as any[]);
  }, [billId]);

  const handleSendSMS = async () => {
    const settings: any = getSettings();

    const shopName = settings?.shop_name || "My Shop";
    const phone = settings?.phone || "";
    const address = settings?.address || "";

    const isAvailable = await SMS.isAvailableAsync();

    if (!isAvailable) {
      Alert.alert("SMS unavailable", "SMS is not available on this device.");
      return;
    }

    if (!bill.mobile || bill.mobile.trim().length !== 10) {
      Alert.alert(
        "Mobile number required",
        "Please enter a valid 10-digit mobile number.",
      );
      return;
    }

    let message = `${shopName}\n${address}\nPhone: ${phone}\n\n`;

    message += `Invoice: ${bill.invoice_number}\n`;
    message += `Customer: ${bill.customer_name}\n\n`;

    items.forEach((item: any) => {
      message += `${item.product_name} x${item.quantity} = ₹${item.total}\n`;
    });

    message += `\nGrand Total: ₹${bill.total}\n`;
    message += `\nThank you for shopping!`;

    try {
      await SMS.sendSMSAsync([bill.mobile], message);
    } catch {
      Alert.alert("Unable to send", "Unable to open the SMS application.");
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const settings: any = getSettings();

      const shopName = settings?.shop_name || "My Shop";
      const address = settings?.address || "";
      const phone = settings?.phone || "";
      const gst = settings?.gst || "";

      const rows = items
        .map(
          (item: any) => `
            <tr>
              <td>${item.product_name}</td>
              <td align="center">${item.quantity}</td>
              <td align="right">₹${item.price}</td>
              <td align="right">₹${item.total}</td>
            </tr>
          `,
        )
        .join("");

      const html = `
        <html>
          <body
            style="
              font-family: Arial;
              padding: 24px;
              color: #20282D;
            "
          >
            <h2 style="text-align:center;">
              ${shopName}
            </h2>

            <p>${address}</p>
            <p>Phone: ${phone}</p>

            ${gst ? `<p>GST: ${gst}</p>` : ""}

            <hr/>

            <p>
              <b>Invoice:</b>
              ${bill.invoice_number}
            </p>

            <p>
              <b>Customer:</b>
              ${bill.customer_name}
            </p>

            <p>
              <b>Mobile:</b>
              ${bill.mobile || "-"}
            </p>

            <p>
              <b>Date:</b>
              ${bill.date}
            </p>

            <p>
              <b>Time:</b>
              ${bill.time}
            </p>

            <table
              width="100%"
              border="1"
              cellspacing="0"
              cellpadding="7"
            >
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>

              ${rows}
            </table>

            <h2 style="text-align:right;">
              Grand Total: ₹${bill.total}
            </h2>

            <hr/>

            <p style="text-align:center;">
              Thank you for shopping!
            </p>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html,
      });

      await Sharing.shareAsync(uri);
    } catch (error) {
      console.log(error);

      Alert.alert("PDF unavailable", "Unable to generate the invoice PDF.");
    }
  };

  if (!bill) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F7F6F2",
        }}
      >
        <Text
          style={{
            color: "#7B848A",
            fontSize: 15,
          }}
        >
          Loading invoice...
        </Text>
      </View>
    );
  }

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
          paddingTop: 18,
          paddingBottom: 14,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: "#E9F0F1",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          <Text
            style={{
              fontSize: 24,
              color: "#496875",
              marginTop: -2,
            }}
          >
            ‹
          </Text>
        </TouchableOpacity>

        <View>
          <Text
            style={{
              fontSize: 11,
              color: "#8A9195",
              fontWeight: "700",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Transaction
          </Text>

          <Text
            style={{
              fontSize: 23,
              fontWeight: "800",
              color: "#20282D",
              marginTop: 2,
            }}
          >
            Invoice
          </Text>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 35,
        }}
        ListHeaderComponent={
          <View>
            {/* Invoice card */}
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 18,
                padding: 20,
                borderWidth: 1,
                borderColor: "#E8E5DF",
                marginBottom: 14,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#8A9195",
                      fontWeight: "700",
                      letterSpacing: 0.8,
                      marginBottom: 5,
                    }}
                  >
                    INVOICE NUMBER
                  </Text>

                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: "800",
                      color: "#20282D",
                    }}
                  >
                    {bill.invoice_number}
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: "#E9F0F1",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: "#496875",
                      fontSize: 11,
                      fontWeight: "800",
                    }}
                  >
                    PAID
                  </Text>
                </View>
              </View>

              <View
                style={{
                  height: 1,
                  backgroundColor: "#F0EEE9",
                  marginVertical: 16,
                }}
              />

              {/* Customer */}
              <Text
                style={{
                  fontSize: 11,
                  color: "#8A9195",
                  fontWeight: "700",
                  letterSpacing: 0.8,
                  marginBottom: 5,
                }}
              >
                CUSTOMER
              </Text>

              <Text
                style={{
                  fontSize: 16,
                  color: "#303A40",
                  fontWeight: "700",
                }}
              >
                {bill.customer_name}
              </Text>

              {bill.mobile ? (
                <Text
                  style={{
                    fontSize: 13,
                    color: "#7B848A",
                    marginTop: 4,
                  }}
                >
                  {bill.mobile}
                </Text>
              ) : null}

              <View
                style={{
                  flexDirection: "row",
                  marginTop: 18,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#8A9195",
                      fontWeight: "700",
                      marginBottom: 5,
                    }}
                  >
                    DATE
                  </Text>

                  <Text
                    style={{
                      fontSize: 13,
                      color: "#59636A",
                      fontWeight: "600",
                    }}
                  >
                    {bill.date}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#8A9195",
                      fontWeight: "700",
                      marginBottom: 5,
                    }}
                  >
                    TIME
                  </Text>

                  <Text
                    style={{
                      fontSize: 13,
                      color: "#59636A",
                      fontWeight: "600",
                    }}
                  >
                    {bill.time}
                  </Text>
                </View>
              </View>
            </View>

            {/* Items heading */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "800",
                  color: "#303A40",
                }}
              >
                Items
              </Text>

              <Text
                style={{
                  fontSize: 13,
                  color: "#8A9195",
                }}
              >
                {items.length} {items.length === 1 ? "item" : "items"}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 14,
              padding: 15,
              marginBottom: 9,
              borderWidth: 1,
              borderColor: "#E8E5DF",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1, paddingRight: 15 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: "#303A40",
                    marginBottom: 5,
                  }}
                  numberOfLines={2}
                >
                  {item.product_name}
                </Text>

                <Text
                  style={{
                    fontSize: 13,
                    color: "#8A9195",
                  }}
                >
                  ₹{item.price} × {item.quantity}
                </Text>
              </View>

              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: "#344F5A",
                  alignSelf: "center",
                }}
              >
                ₹{item.total}
              </Text>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View>
            {/* Total */}
            <View
              style={{
                backgroundColor: "#EEF2F2",
                borderRadius: 16,
                padding: 18,
                marginTop: 5,
                marginBottom: 15,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: "#59636A",
                    fontWeight: "600",
                  }}
                >
                  Grand Total
                </Text>

                <Text
                  style={{
                    fontSize: 25,
                    color: "#344F5A",
                    fontWeight: "900",
                  }}
                >
                  ₹{bill.total}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <TouchableOpacity
              onPress={handleDownloadPDF}
              activeOpacity={0.8}
              style={{
                backgroundColor: "#344F5A",
                padding: 16,
                borderRadius: 12,
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  textAlign: "center",
                  fontSize: 15,
                  fontWeight: "800",
                }}
              >
                Download / Share PDF
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSendSMS}
              activeOpacity={0.8}
              style={{
                backgroundColor: "#FFFFFF",
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#D9E0E1",
              }}
            >
              <Text
                style={{
                  color: "#496875",
                  textAlign: "center",
                  fontSize: 15,
                  fontWeight: "800",
                }}
              >
                Send Invoice by SMS
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}
