import { useLocalSearchParams, useRouter } from "expo-router"; // 🔹 Added useLocalSearchParams
import {
    ArrowLeft,
    Banknote,
    CheckCircle2,
    Circle,
    CreditCard,
    MapPin,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
// 🔹 Added orderApi import for the place order endpoint
import { mainApi, orderApi } from "../axios/axiosInstance";

// 1. Interface matching your provided JSON
interface Address {
  id: string;
  fullName: string;
  phoneNumber: string;
  street: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  default: boolean;
}

type PaymentMethod = "COD" | "RAZORPAY";

const CheckoutPage = () => {
  const router = useRouter();

  // 🔹 Extract the passed IDs from the router params
  const { orderItemIds } = useLocalSearchParams();
  const parsedItemIds = orderItemIds
    ? (orderItemIds as string).split(",").map((id) => parseInt(id, 10))
    : [];

  // State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("RAZORPAY");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await mainApi.get("/addresses");
      const fetchedAddresses: Address[] = response.data;
      setAddresses(fetchedAddresses);

      // Auto-select default address, or the first one if no default exists
      if (fetchedAddresses.length > 0) {
        const defaultAddress = fetchedAddresses.find((addr) => addr.default);
        setSelectedAddressId(
          defaultAddress ? defaultAddress.id : fetchedAddresses[0].id,
        );
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
      Alert.alert("Error", "Could not load delivery addresses.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 NEW: Function to set address as default using PATCH
  const handleSetDefault = async (id: string) => {
    try {
      await mainApi.patch(`/addresses/${id}/default`);
      fetchAddresses(); // Refresh the list to reflect the new default status
    } catch (error) {
      console.error("Failed to set default address:", error);
      Alert.alert("Error", "Could not set as default address.");
    }
  };

  // 🔹 Converted to async to handle API call
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      Alert.alert("Missing Info", "Please select a delivery address.");
      return;
    }

    if (parsedItemIds.length === 0) {
      Alert.alert("Error", "Your cart is empty.");
      return;
    }

    if (paymentMethod === "COD") {
      try {
        // 🔹 ACTUAL API CALL for COD Placement
        await orderApi.post("/orders/place/cod", {
          orderItemIds: parsedItemIds,
        });

        Alert.alert(
          "Success",
          "Order placed successfully with Cash on Delivery!",
          [
            { text: "OK", onPress: () => router.push("/") }, // Redirect to home/orders on success
          ],
        );
      } catch (error) {
        console.error("Failed to place COD order:", error);
        Alert.alert("Error", "Failed to place your order. Please try again.");
      }
    } else {
      Alert.alert("Processing", "Redirecting to Razorpay...");
      // Initialize Razorpay SDK here
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F2A20C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.header}>CHECKOUT</Text>
        <View style={{ width: 24 }} /> {/* Spacer to center title */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Section 1: Delivery Address */}
        <Text style={styles.sectionTitle}>DELIVERY ADDRESS</Text>

        {addresses.length === 0 ? (
          <View style={styles.emptyCard}>
            <MapPin size={32} color="#666" style={{ marginBottom: 10 }} />
            <Text style={styles.emptyText}>No addresses found.</Text>
            <TouchableOpacity style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ ADD NEW ADDRESS</Text>
            </TouchableOpacity>
          </View>
        ) : (
          addresses.map((address) => {
            const isSelected = selectedAddressId === address.id;
            return (
              <TouchableOpacity
                key={address.id}
                style={[styles.addressCard, isSelected && styles.selectedCard]}
                onPress={() => setSelectedAddressId(address.id)}
                activeOpacity={0.8}
              >
                <View style={styles.radioContainer}>
                  {isSelected ? (
                    <CheckCircle2 size={24} color="#F2A20C" />
                  ) : (
                    <Circle size={24} color="#666" />
                  )}
                </View>
                <View style={styles.addressDetails}>
                  <Text style={styles.nameText}>{address.fullName}</Text>
                  <Text style={styles.addressText}>
                    {address.street}, {address.city}
                  </Text>
                  <Text style={styles.addressText}>
                    {address.state} - {address.pinCode}
                  </Text>
                  <Text style={styles.phoneText}>
                    Mobile: +91 {address.phoneNumber}
                  </Text>

                  {/* Set Default Button / Default Badge */}
                  {!address.default ? (
                    <TouchableOpacity
                      onPress={() => handleSetDefault(address.id)}
                    >
                      <Text
                        style={{
                          color: "#F2A20C",
                          fontSize: 12,
                          fontWeight: "800",
                          marginTop: 10,
                        }}
                      >
                        SET AS DEFAULT
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text
                      style={{
                        color: "#34C759",
                        fontSize: 12,
                        fontWeight: "800",
                        marginTop: 10,
                      }}
                    >
                      ✓ DEFAULT ADDRESS
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Section 2: Payment Method */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
          PAYMENT METHOD
        </Text>

        <TouchableOpacity
          style={[
            styles.paymentCard,
            paymentMethod === "RAZORPAY" && styles.selectedCard,
          ]}
          onPress={() => setPaymentMethod("RAZORPAY")}
          activeOpacity={0.8}
        >
          <View style={styles.paymentInfo}>
            <CreditCard
              size={24}
              color={paymentMethod === "RAZORPAY" ? "#F2A20C" : "#CCC"}
            />
            <Text style={styles.paymentText}>Pay Online (Razorpay)</Text>
          </View>
          {paymentMethod === "RAZORPAY" ? (
            <CheckCircle2 size={24} color="#F2A20C" />
          ) : (
            <Circle size={24} color="#666" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.paymentCard,
            paymentMethod === "COD" && styles.selectedCard,
          ]}
          onPress={() => setPaymentMethod("COD")}
          activeOpacity={0.8}
        >
          <View style={styles.paymentInfo}>
            <Banknote
              size={24}
              color={paymentMethod === "COD" ? "#F2A20C" : "#CCC"}
            />
            <Text style={styles.paymentText}>Cash on Delivery (COD)</Text>
          </View>
          {paymentMethod === "COD" ? (
            <CheckCircle2 size={24} color="#F2A20C" />
          ) : (
            <Circle size={24} color="#666" />
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Footer / Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.checkoutBtn, !selectedAddressId && styles.disabledBtn]}
          onPress={handlePlaceOrder}
          disabled={!selectedAddressId}
        >
          <Text style={styles.checkoutText}>
            {paymentMethod === "COD" ? "PLACE ORDER (COD)" : "PROCEED TO PAY"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A1A1A" },
  center: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: Platform.OS === "ios" ? 50 : 30,
    marginBottom: 20,
  },
  backBtn: { padding: 5 },
  header: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Make room for fixed footer
  },
  sectionTitle: {
    color: "#AAA",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 15,
  },

  // Address Card Styles
  addressCard: {
    flexDirection: "row",
    backgroundColor: "#262626",
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedCard: {
    borderColor: "#F2A20C",
    backgroundColor: "#2A241A", // Slight orange tint to background
  },
  radioContainer: {
    marginRight: 15,
    justifyContent: "center",
  },
  addressDetails: {
    flex: 1,
  },
  nameText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },
  addressText: {
    color: "#CCC",
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  phoneText: {
    color: "#F2A20C",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 6,
  },

  // Empty Address State
  emptyCard: {
    backgroundColor: "#262626",
    borderRadius: 12,
    padding: 30,
    alignItems: "center",
    marginBottom: 15,
  },
  emptyText: {
    color: "#888",
    fontSize: 14,
    marginBottom: 15,
  },
  addBtn: {
    borderWidth: 1,
    borderColor: "#F2A20C",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  addBtnText: {
    color: "#F2A20C",
    fontWeight: "700",
  },

  // Payment Card Styles
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#262626",
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "transparent",
  },
  paymentInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  paymentText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },

  // Footer Styles
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#262626",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
  },
  checkoutBtn: {
    backgroundColor: "#F2A20C",
    height: 52,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledBtn: {
    backgroundColor: "#555",
  },
  checkoutText: {
    color: "#1A1A1A",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1,
  },
});

export default CheckoutPage;
