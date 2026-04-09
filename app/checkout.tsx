import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  CreditCard,
  Home,
  IndianRupee,
  MapPin,
  Plus,
  Shield,
  Truck,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import { mainApi, orderApi } from "../axios/axiosInstance";

//const RAZORPAY_KEY_ID = "rzp_test_RxJu5AW2ZIFxcL";

const { width } = Dimensions.get("window");

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

// Helper to handle JS float precision issues securely
const formatPrice = (price: number) => {
  return Number(price).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// 🔹 FIX: Helper to dynamically load Razorpay Web SDK
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CheckoutPage = () => {
  const router = useRouter();

  const { orderItemIds } = useLocalSearchParams();
  const parsedItemIds = orderItemIds
    ? (orderItemIds as string).split(",").map((id) => parseInt(id, 10))
    : [];

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );

  // 🔹 FIX: Set default payment method based on Android OR Web
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    Platform.OS === "android" || Platform.OS === "web" ? "RAZORPAY" : "COD",
  );

  const [loading, setLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // 🔹 Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState<{
    orderId: number;
    finalAmount: number;
  } | null>(null);

  // 🔹 State to hold the checkout totals
  const [cartSummary, setCartSummary] = useState({
    subTotal: 0,
    deliveryCharge: 0,
    grandTotal: 0,
  });

  useEffect(() => {
    const loadCheckoutData = async () => {
      setLoading(true);
      await Promise.all([fetchAddresses(), fetchCartSummary()]);
      setLoading(false);
    };

    loadCheckoutData();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await mainApi.get("/addresses");
      const fetchedAddresses: Address[] = response.data;
      setAddresses(fetchedAddresses);

      if (fetchedAddresses.length > 0) {
        const defaultAddress = fetchedAddresses.find((addr) => addr.default);
        setSelectedAddressId(
          defaultAddress ? defaultAddress.id : fetchedAddresses[0].id,
        );
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
      Alert.alert("Error", "Could not load delivery addresses.");
    }
  };

  const fetchCartSummary = async () => {
    try {
      const response = await orderApi.get(`/orders/cart`);
      setCartSummary({
        subTotal: response.data.subTotal || 0,
        deliveryCharge: response.data.deliveryCharge || 0,
        grandTotal: response.data.grandTotal || 0,
      });
    } catch (error) {
      console.error("Cart fetch error:", error);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await mainApi.patch(`/addresses/${id}/default`);
      fetchAddresses();
    } catch (error) {
      console.error("Failed to set default address:", error);
      Alert.alert("Error", "Could not set as default address.");
    }
  };

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
        setIsPlacingOrder(true);
        const response = await orderApi.post("/orders/place/cod", {
          orderItemIds: parsedItemIds,
        });

        setOrderDetails({
          orderId: response.data.orderId,
          finalAmount: response.data.finalAmount,
        });
        setShowSuccessModal(true);
      } catch (error) {
        console.error("Failed to place COD order:", error);
        Alert.alert("Error", "Failed to place your order. Please try again.");
      } finally {
        setIsPlacingOrder(false);
      }
    } else {
      // --- ONLINE PAYMENT FLOW (RAZORPAY) ---

      // 🔹 FIX: Block execution ONLY if it's not Android and not Web (e.g. iOS)
      if (Platform.OS !== "android" && Platform.OS !== "web") {
        Alert.alert(
          "Notice",
          "Online payments are currently only supported on Android and Web.",
        );
        return;
      }

      try {
        setIsPlacingOrder(true);

        // 1. Create Online Order
        const orderResponse = await orderApi.post("/orders/place/online", {
          orderItemIds: parsedItemIds,
        });

        const backendOrderId = orderResponse.data.orderId;
        const finalAmount = orderResponse.data.finalAmount;

        // 2. Initialize Payment on Backend
        const paymentResponse = await mainApi.post(
          `/payments/create/${backendOrderId}`,
        );
        const paymentData = paymentResponse.data;

        // 3. Configure Razorpay Options
        const options: any = {
          description: "Order Payment",
          image: "https://i.imgur.com/3g7nmJC.png", // Replace with your app logo
          currency: paymentData.currency || "INR",
          key: paymentData.key,
          amount: Math.round(paymentData.amount * 100), // Razorpay expects paise (amount * 100)
          name: "Auto Fusion",
          order_id: paymentData.razorpayOrderId,
          theme: { color: "#F2A20C" },
        };

        // 4. Branch Logic based on Platform
        if (Platform.OS === "web") {
          const isLoaded = await loadRazorpayScript();

          if (!isLoaded) {
            Alert.alert(
              "Error",
              "Razorpay SDK failed to load. Are you online?",
            );
            setIsPlacingOrder(false);
            return;
          }

          // Web uses callbacks instead of promises for verification
          options.handler = async function (response: any) {
            try {
              setIsPlacingOrder(true); // Re-trigger loading state during backend verification
              await mainApi.post("/payments/verify", {
                paymentId: paymentData.paymentId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              setOrderDetails({
                orderId: backendOrderId,
                finalAmount: finalAmount,
              });
              setShowSuccessModal(true);
            } catch (error) {
              console.error("Web Verification Error:", error);
              Alert.alert("Error", "Payment verification failed.");
            } finally {
              setIsPlacingOrder(false);
            }
          };

          const rzp = new (window as any).Razorpay(options);

          rzp.on("payment.failed", function (response: any) {
            Alert.alert("Payment Failed", response.error.description);
          });

          rzp.open();
          // State gets reset in the finally block below, which allows the user to interact with the modal
        } else {
          // ANDROID NATIVE FLOW
          const razorpayResponse = await RazorpayCheckout.open(options);

          // Verify Payment on Backend
          await mainApi.post("/payments/verify", {
            paymentId: paymentData.paymentId,
            razorpayOrderId: razorpayResponse.razorpay_order_id,
            razorpayPaymentId: razorpayResponse.razorpay_payment_id,
            razorpaySignature: razorpayResponse.razorpay_signature,
          });

          // Trigger Success Modal
          setOrderDetails({
            orderId: backendOrderId,
            finalAmount: finalAmount,
          });
          setShowSuccessModal(true);
        }
      } catch (error: any) {
        console.error("Razorpay Checkout Error:", error);

        // Handle User Cancellation vs Actual Error (Native only)
        if (Platform.OS === "android") {
          const errorMsg =
            error.description ||
            error.response?.data?.message ||
            "Payment failed or was cancelled.";
          Alert.alert("Payment Incomplete", errorMsg);
        }
      } finally {
        // Turns off the React Native loading spinner.
        // For web, this happens exactly as the modal opens, which is correct.
        setIsPlacingOrder(false);
      }
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    router.replace("/");
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
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#F2A20C" />
        </TouchableOpacity>
        <Text style={styles.header}>CHECKOUT</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Delivery Info Banner */}
        <View style={styles.infoBanner}>
          <Truck size={20} color="#F2A20C" />
          <Text style={styles.infoBannerText}>
            {cartSummary.deliveryCharge === 0
              ? "Free delivery applied to this order"
              : `Delivery charge of ₹${formatPrice(
                  cartSummary.deliveryCharge,
                )} applies`}
          </Text>
        </View>

        {/* Section 1: Delivery Address */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleContainer}>
            <MapPin size={18} color="#1A1A1A" />
            <Text style={styles.sectionTitle}>DELIVERY ADDRESS</Text>
          </View>
          {addresses.length > 0 && (
            <TouchableOpacity
              style={styles.miniAddBtn}
              onPress={() => {
                router.push("/address");
              }}
            >
              <Plus size={16} color="#F2A20C" />
              <Text style={styles.miniAddText}>ADD NEW</Text>
            </TouchableOpacity>
          )}
        </View>

        {addresses.length === 0 ? (
          <View style={styles.emptyCard}>
            <MapPin size={50} color="#E0E0E0" style={{ marginBottom: 15 }} />
            <Text style={styles.emptyText}>No delivery addresses found</Text>
            <Text style={styles.emptySubtext}>
              Add your first address to continue
            </Text>
            <TouchableOpacity style={styles.addBtn}>
              <LinearGradient
                colors={["#F2A20C", "#E8960A"]}
                style={styles.addBtnGradient}
              >
                <Plus size={20} color="#FFF" />
                <Text style={styles.addBtnText}>ADD NEW ADDRESS</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          addresses.map((address) => {
            const isSelected = selectedAddressId === address.id;
            return (
              <TouchableOpacity
                key={address.id}
                style={[styles.card, isSelected && styles.selectedCard]}
                onPress={() => setSelectedAddressId(address.id)}
                activeOpacity={0.8}
              >
                {address.default && (
                  <View style={styles.defaultRibbon}>
                    <Text style={styles.defaultRibbonText}>DEFAULT</Text>
                  </View>
                )}

                <View style={styles.cardContent}>
                  <View style={styles.cardTop}>
                    <View style={styles.nameContainer}>
                      <View
                        style={[
                          styles.iconBox,
                          isSelected && styles.iconBoxSelected,
                        ]}
                      >
                        <Home
                          size={20}
                          color={isSelected ? "#F2A20C" : "#888"}
                        />
                      </View>
                      <View style={styles.nameTextWrapper}>
                        <Text style={styles.nameText}>{address.fullName}</Text>
                        <Text style={styles.phoneText}>
                          +91 {address.phoneNumber}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.radioContainer}>
                      {isSelected ? (
                        <CheckCircle2 size={24} color="#F2A20C" />
                      ) : (
                        <Circle size={24} color="#E5E5E5" />
                      )}
                    </View>
                  </View>

                  <View style={styles.addressBody}>
                    <Text style={styles.addressText}>
                      {address.street}, {address.city}
                    </Text>
                    <Text style={styles.addressText}>
                      {address.state} - {address.pinCode}
                    </Text>
                  </View>

                  {!address.default && (
                    <TouchableOpacity
                      style={styles.setDefaultBtn}
                      onPress={() => handleSetDefault(address.id)}
                    >
                      <Text style={styles.setDefaultText}>Set as Default</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Section 2: Payment Method */}
        <View style={[styles.sectionHeaderRow, { marginTop: 10 }]}>
          <View style={styles.sectionTitleContainer}>
            <CreditCard size={18} color="#1A1A1A" />
            <Text style={styles.sectionTitle}>PAYMENT METHOD</Text>
          </View>
        </View>

        {/* 🔹 FIX: Show Razorpay Option on Android AND Web */}
        {(Platform.OS === "android" || Platform.OS === "web") && (
          <TouchableOpacity
            style={[
              styles.paymentCard,
              paymentMethod === "RAZORPAY" && styles.selectedPaymentCard,
            ]}
            onPress={() => setPaymentMethod("RAZORPAY")}
            activeOpacity={0.7}
          >
            <View style={styles.paymentContent}>
              <View style={styles.paymentLeft}>
                <View
                  style={[
                    styles.paymentIconContainer,
                    paymentMethod === "RAZORPAY" && styles.iconBoxSelected,
                  ]}
                >
                  <CreditCard
                    size={24}
                    color={paymentMethod === "RAZORPAY" ? "#F2A20C" : "#888"}
                  />
                </View>
                <View>
                  <Text
                    style={[
                      styles.paymentTitle,
                      paymentMethod === "RAZORPAY" &&
                        styles.paymentTitleSelected,
                    ]}
                  >
                    Pay Online
                  </Text>
                  <Text style={styles.paymentSubtitle}>
                    Credit/Debit Card, UPI, NetBanking
                  </Text>
                </View>
              </View>
              {paymentMethod === "RAZORPAY" ? (
                <CheckCircle2 size={24} color="#F2A20C" />
              ) : (
                <Circle size={24} color="#E5E5E5" />
              )}
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.paymentCard,
            paymentMethod === "COD" && styles.selectedPaymentCard,
          ]}
          onPress={() => setPaymentMethod("COD")}
          activeOpacity={0.7}
        >
          <View style={styles.paymentContent}>
            <View style={styles.paymentLeft}>
              <View
                style={[
                  styles.paymentIconContainer,
                  paymentMethod === "COD" && styles.iconBoxSelected,
                ]}
              >
                <IndianRupee
                  size={24}
                  color={paymentMethod === "COD" ? "#F2A20C" : "#888"}
                />
              </View>
              <View>
                <Text
                  style={[
                    styles.paymentTitle,
                    paymentMethod === "COD" && styles.paymentTitleSelected,
                  ]}
                >
                  Cash on Delivery
                </Text>
                <Text style={styles.paymentSubtitle}>
                  Pay when you receive the order
                </Text>
              </View>
            </View>
            {paymentMethod === "COD" ? (
              <CheckCircle2 size={24} color="#F2A20C" />
            ) : (
              <Circle size={24} color="#E5E5E5" />
            )}
          </View>
        </TouchableOpacity>

        {/* Delivery Promise */}
        <View style={styles.deliveryPromise}>
          <View style={styles.promiseItem}>
            <Shield size={16} color="#34C759" />
            <Text style={styles.promiseText}>Secure Payment</Text>
          </View>
          <View style={styles.promiseDivider} />
          <View style={styles.promiseItem}>
            <Clock size={16} color="#34C759" />
            <Text style={styles.promiseText}>Fast Delivery</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerTotalContainer}>
          <Text style={styles.footerTotalLabel}>To Pay</Text>
          <Text style={styles.footerTotalValue}>
            ₹{formatPrice(cartSummary.grandTotal)}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.checkoutBtn,
            (!selectedAddressId || isPlacingOrder) && styles.disabledBtn,
          ]}
          onPress={handlePlaceOrder}
          disabled={!selectedAddressId || isPlacingOrder}
        >
          <LinearGradient
            colors={
              selectedAddressId && !isPlacingOrder
                ? ["#F2A20C", "#E8960A"]
                : ["#E5E5E5", "#D4D4D4"]
            }
            style={styles.checkoutGradient}
          >
            {isPlacingOrder ? (
              <ActivityIndicator color="#1A1A1A" />
            ) : (
              <Text
                style={[
                  styles.checkoutText,
                  !selectedAddressId && { color: "#888" },
                ]}
              >
                {paymentMethod === "COD" ? "PLACE ORDER" : "PROCEED TO PAY"}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIconBg}>
              <CheckCircle2 size={48} color="#34C759" />
            </View>
            <Text style={styles.modalTitle}>Order Placed!</Text>

            {orderDetails && (
              <View style={styles.orderDetailsBox}>
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Order ID:</Text>
                  <Text style={styles.orderDetailValue}>
                    #{orderDetails.orderId}
                  </Text>
                </View>
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Amount:</Text>
                  <Text style={styles.orderDetailValue}>
                    ₹{formatPrice(orderDetails.finalAmount)}
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.modalSubtitle}>
              Thank you for shopping with us. Your order is currently being
              processed.
            </Text>

            <TouchableOpacity
              style={styles.modalBtn}
              onPress={handleModalClose}
            >
              <LinearGradient
                colors={["#F2A20C", "#E8960A"]}
                style={styles.modalBtnGradient}
              >
                <Text style={styles.modalBtnText}>CONTINUE SHOPPING</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  center: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backBtn: {
    padding: 10,
    backgroundColor: "#FFF8F0",
    borderRadius: 12,
  },
  header: {
    color: "#1A1A1A",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 140,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8F0",
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(242, 162, 12, 0.2)",
  },
  infoBannerText: {
    color: "#F2A20C",
    fontSize: 13,
    fontWeight: "700",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    color: "#1A1A1A",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
  },
  miniAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF8F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  miniAddText: {
    color: "#F2A20C",
    fontSize: 12,
    fontWeight: "700",
  },

  // Address Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: {
    borderColor: "#F2A20C",
    backgroundColor: "#FFFCF8",
  },
  defaultRibbon: {
    position: "absolute",
    top: 12,
    right: -30,
    transform: [{ rotate: "45deg" }],
    backgroundColor: "#34C759",
    paddingHorizontal: 30,
    paddingVertical: 4,
    zIndex: 1,
  },
  defaultRibbonText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  cardContent: {
    padding: 16,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    gap: 12,
  },
  iconBox: {
    backgroundColor: "#F8F9FA",
    padding: 10,
    borderRadius: 12,
  },
  iconBoxSelected: {
    backgroundColor: "#FFF8F0",
  },
  nameTextWrapper: {
    justifyContent: "center",
  },
  nameText: {
    color: "#1A1A1A",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  phoneText: {
    color: "#666",
    fontSize: 13,
    fontWeight: "500",
  },
  radioContainer: {
    marginLeft: 10,
    marginTop: 4,
  },
  addressBody: {
    marginLeft: 46,
    marginBottom: 12,
  },
  addressText: {
    color: "#666",
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 20,
  },
  setDefaultBtn: {
    marginLeft: 46,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  setDefaultText: {
    color: "#F2A20C",
    fontSize: 13,
    fontWeight: "700",
  },

  // Empty Address State
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderStyle: "dashed",
  },
  emptyText: {
    color: "#1A1A1A",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },
  emptySubtext: {
    color: "#888",
    fontSize: 13,
    marginBottom: 24,
  },
  addBtn: {
    borderRadius: 12,
    overflow: "hidden",
  },
  addBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  addBtnText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.5,
  },

  // Payment Cards
  paymentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedPaymentCard: {
    borderColor: "#F2A20C",
    backgroundColor: "#FFFCF8",
  },
  paymentContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
  },
  paymentTitle: {
    color: "#1A1A1A",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },
  paymentTitleSelected: {
    color: "#F2A20C",
  },
  paymentSubtitle: {
    color: "#666",
    fontSize: 12,
    fontWeight: "500",
  },

  // Trust / Promise Section
  deliveryPromise: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    gap: 16,
  },
  promiseItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  promiseText: {
    color: "#666",
    fontSize: 13,
    fontWeight: "600",
  },
  promiseDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#E5E5E5",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 10,
  },
  footerTotalContainer: {
    flex: 1,
  },
  footerTotalLabel: {
    color: "#666",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  footerTotalValue: {
    color: "#1A1A1A",
    fontSize: 22,
    fontWeight: "900",
  },
  checkoutBtn: {
    flex: 1.2,
    borderRadius: 12,
    overflow: "hidden",
    marginLeft: 15,
  },
  checkoutGradient: {
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledBtn: {
    opacity: 0.8,
  },
  checkoutText: {
    color: "#1A1A1A",
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 0.5,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#FFF",
    width: "100%",
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(52, 199, 89, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1A1A1A",
    marginBottom: 16,
    textAlign: "center",
  },
  orderDetailsBox: {
    backgroundColor: "#F8F9FA",
    width: "100%",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  orderDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  orderDetailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  orderDetailValue: {
    fontSize: 15,
    color: "#1A1A1A",
    fontWeight: "800",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  modalBtn: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  modalBtnGradient: {
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBtnText: {
    color: "#1A1A1A",
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 0.5,
  },
});

export default CheckoutPage;
