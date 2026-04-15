import { cartApi } from "@/axios/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import PremiumAlert from "../app/_components/PremiumAlert";

type AlertType = "success" | "warning" | "error"|"confirm";

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  PLACED: { label: "Placed", color: "#3B82F6", icon: "cube-outline" },
  DISPATCHED: { label: "Dispatched", color: "#8B5CF6", icon: "airplane-outline" },
  DELIVERED: { label: "Delivered", color: "#10B981", icon: "checkmark-done-circle-outline" },
  PAYMENT_PENDING: { label: "Pending", color: "#F59E0B", icon: "time-outline" },
  CANCELLED: { label: "Cancelled", color: "#EF4444", icon: "close-circle-outline" }, // Added
};

const FILTERS = ["All", "PLACED", "DISPATCHED", "DELIVERED", "PAYMENT_PENDING", "CANCELLED"];

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [comments, setComments] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<number | null>(null);
  
  
  const [reviewedProducts, setReviewedProducts] = useState<Record<string, boolean>>({});

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: "success" as AlertType,
    title: "",
    message: "",
    onConfirm: () => {},
  });

 const showAlert = (type: AlertType, title: string, message: string, onConfirm?: () => void) => {
  setAlertConfig({ 
    visible: true, 
    type, 
    title, 
    message, 
    onConfirm: onConfirm || (() => {}) 
  });
};

  
  const fetchUserReviews = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res = await cartApi.get("/reviews/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const reviewMap: Record<string, boolean> = {};
      res.data.forEach((rev: any) => {
       
        reviewMap[`${rev.orderId}-${rev.productId}`] = true;
      });
      setReviewedProducts(reviewMap);
    } catch (error) {
      console.log("Error fetching reviews:", error);
    }
  }, []);


  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const res = await cartApi.get("/orders/all/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchUserReviews();
  }, [fetchOrders, fetchUserReviews]);

  const handleMarkDelivered = async (orderId: number) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await cartApi.patch(`/orders/deliver/${orderId}`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showAlert("success", "Success", "Order marked as received!");
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, orderStatus: "DELIVERED" } : o))
      );
    } catch (error) {
      showAlert("error", "Error", "Failed to update status.");
    }
  };

  const handlePostReview = async (productId: number, orderId: number) => {
    const rating = ratings[productId] || 0;
    const comment = comments[productId] || "";

    if (rating === 0) {
      showAlert("warning", "Rating Required", "Please select a star rating.");
      return;
    }

    try {
      setIsSubmitting(productId);
      const token = await AsyncStorage.getItem("token");
      await cartApi.post("/reviews", { productId, orderId, rating, comment }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showAlert("success", "Success", "Your review has been posted!");
      
     
      setReviewedProducts((prev) => ({ 
        ...prev, 
        [`${orderId}-${productId}`]: true 
      }));
      
      setRatings((prev) => ({ ...prev, [productId]: 0 }));
      setComments((prev) => ({ ...prev, [productId]: "" }));
    } catch (error: any) {
      const msg = error.response?.data?.message || "Review submission failed";
      showAlert("warning", "Warning", msg);
    } finally {
      setIsSubmitting(null);
    }
  };
  const handleCancelOrder = (orderId: number) => {
  showAlert(
    "confirm", 
    "Cancel Order",
    "Are you sure you want to cancel this order?",
    async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        await cartApi.patch(`/orders/cancel/${orderId}`, null, {
          headers: { Authorization: `Bearer ${token}` },
        });

     
        showAlert("success", "Cancelled", "Your order has been cancelled.");
        
      
        setOrders((prev) =>
          prev.map((o) => (o.orderId === orderId ? { ...o, orderStatus: "CANCELLED" } : o))
        );
      } catch (error: any) {
        const msg = error.response?.data?.message || "Failed to cancel order.";
        showAlert("error", "Error", msg);
      }
    }
  );
};
  const filteredOrders = useMemo(() => {
    if (activeFilter === "All") return orders;
    return orders.filter((o) => o.orderStatus === activeFilter);
  }, [activeFilter, orders]);

  const renderOrderCard = ({ item }: { item: any }) => {
    const status = STATUS_MAP[item.orderStatus] || { label: item.orderStatus, color: "#94A3B8", icon: "help-circle-outline" };
    const isExpanded = expandedOrderId === item.orderId;
    const orderItems = item.orderItems || [];
    
  
    const isFullyReviewed = orderItems.length > 0 && orderItems.every((p: any) => 
      reviewedProducts[`${item.orderId}-${p.productId}`]
    );

    return (
      <View style={styles.orderCard}>
        <View style={[styles.statusIndicator, { backgroundColor: status.color }]} />
        <View style={styles.cardContent}>
          
<View style={styles.cardHeader}>
  <View>
    <Text style={styles.orderId}>Order #{item.orderId}</Text>
    <Text style={styles.paymentText}>
      {item.paymentMode} • {orderItems.length} Products
    </Text>
    
    <Text style={styles.dateText}>Placed: {item.orderDate}</Text>
    
    
    {item.orderStatus === "CANCELLED" && item.cancelledAt && (
      <Text style={styles.cancelledDateText}>
        Cancelled: {item.cancelledAt}
      </Text>
    )}
  </View>
  
  <View style={[styles.statusBadge, { backgroundColor: `${status.color}15` }]}>
    <Ionicons name={status.icon as any} size={16} color={status.color} style={{ marginRight: 4 }} />
    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
  </View>
</View>

          <View style={styles.divider} />
          <Text style={styles.metaLabel}>Total Price</Text>
          <Text style={styles.totalPrice}>₹{item.finalAmount?.toFixed(2)}</Text>

          <View style={styles.actionContainer}>
            {(item.orderStatus === "PLACED" || item.orderStatus === "PAYMENT_PENDING") && (
    <Pressable 
      style={[styles.primaryAction, { backgroundColor: "#FEE2E2", marginBottom: 8 }]} 
      onPress={() => handleCancelOrder(item.orderId)}
    >
      <Text style={[styles.primaryActionText, { color: "#EF4444" }]}>Cancel Order</Text>
    </Pressable>
  )}
            {item.orderStatus === "DISPATCHED" && (
              <Pressable style={styles.primaryAction} onPress={() => handleMarkDelivered(item.orderId)}>
                <Text style={styles.primaryActionText}>Mark as Received</Text>
              </Pressable>
            )}

            {item.orderStatus === "DELIVERED" && (
              <Pressable
                style={styles.secondaryAction}
                onPress={() => setExpandedOrderId(isExpanded ? null : item.orderId)}
              >
                <Ionicons
                  name={isFullyReviewed ? "checkmark-circle" : (isExpanded ? "chevron-up" : "star-outline")}
                  size={16}
                  color={isFullyReviewed ? "#10B981" : "#475569"}
                />
                <Text style={[styles.secondaryActionText, isFullyReviewed && { color: "#10B981" }]}>
                  {isFullyReviewed ? "All Reviewed" : (isExpanded ? "Hide Review" : "Write Review")}
                </Text>
              </Pressable>
            )}
          </View>

          {isExpanded && (
            <View style={styles.reviewSection}>
              {orderItems.length > 0 ? (
                orderItems.map((prod: any) => {
                  const isThisReviewed = reviewedProducts[`${item.orderId}-${prod.productId}`];
                  return (
                    <View key={prod.productId} style={styles.productReviewBox}>
                      <Text style={styles.productNameReview}>{prod.pname}</Text>
                      
                      {isThisReviewed ? (
                        <View style={styles.reviewedBadge}>
                          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                          <Text style={styles.reviewedBadgeText}>Review Marked</Text>
                        </View>
                      ) : (
                        <>
                          <View style={styles.starRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Pressable key={star} onPress={() => setRatings((p) => ({ ...p, [prod.productId]: star }))}>
                                <Ionicons
                                  name={(ratings[prod.productId] || 0) >= star ? "star" : "star-outline"}
                                  size={26}
                                  color="#F2A20C"
                                />
                              </Pressable>
                            ))}
                          </View>
                          <TextInput
                            style={styles.reviewInput}
                            placeholder="Feedback..."
                            value={comments[prod.productId] || ""}
                            onChangeText={(t) => setComments((p) => ({ ...p, [prod.productId]: t }))}
                            multiline
                          />
                          <Pressable
                            style={[styles.submitReviewBtn, (ratings[prod.productId] || 0) === 0 && { opacity: 0.5 }]}
                            onPress={() => handlePostReview(prod.productId, item.orderId)}
                            disabled={isSubmitting === prod.productId}
                          >
                            {isSubmitting === prod.productId ? (
                              <ActivityIndicator color="#FFF" />
                            ) : (
                              <Text style={styles.submitReviewText}>Submit Review</Text>
                            )}
                          </Pressable>
                        </>
                      )}
                    </View>
                  );
                })
              ) : (
                <View style={styles.noProductsBox}>
                  <Text style={styles.noProductsText}>No items found in this order.</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <TouchableOpacity
          onPress={() => router.push("/")}
          style={styles.headerIconBtn}
        >
          <ArrowLeft color="#F2A20C" size={24} />
        </TouchableOpacity>
        <Text style={styles.welcomeText}>My Purchases</Text>
        <Pressable onPress={() => { fetchOrders(); fetchUserReviews(); }} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={22} color="#F2A20C" />
        </Pressable>
      </View>

      <View style={{ height: 50 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[styles.filterChip, activeFilter === f && styles.activeChip]}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.activeFilterText]}>
                {f === "All" ? "All" : STATUS_MAP[f]?.label || f}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#F2A20C" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.orderId.toString()}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listPadding}
          ListEmptyComponent={<Text style={styles.emptyTitle}>No orders found</Text>}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => { fetchOrders(); fetchUserReviews(); }} tintColor="#F2A20C" />
          }
        />
      )}
<PremiumAlert
  visible={alertConfig.visible}
  type={alertConfig.type}
  title={alertConfig.title}
  message={alertConfig.message}
  onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
  onConfirm={() => {
    alertConfig.onConfirm(); 
    setAlertConfig((prev) => ({ ...prev, visible: false })); 
  }}
/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  headerSection: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20,paddingTop: Platform.OS === "android" ? 20 : 20 },
  welcomeText: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  refreshBtn: { padding: 8, backgroundColor: "#FFF", borderRadius: 10, elevation: 2 },
  filterList: { paddingHorizontal: 20, gap: 8, marginBottom: 20 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: "#E2E8F0" },
  activeChip: { backgroundColor: "#F2A20C" },
  filterText: { fontSize: 13, fontWeight: "600", color: "#475569" },
  activeFilterText: { color: "#FFF" },
  listPadding: { paddingHorizontal: 20, paddingBottom: 40 },
  orderCard: { backgroundColor: "#FFF", borderRadius: 16, marginBottom: 16, flexDirection: "row", overflow: "hidden", elevation: 3 },
  statusIndicator: { width: 5 },
  cardContent: { flex: 1, padding: 16 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  orderId: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  paymentText: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 12 },
  metaLabel: { fontSize: 10, color: "#94A3B8", textTransform: "uppercase", fontWeight: "700" },
  totalPrice: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  actionContainer: { marginTop: 15 },
  primaryAction: { backgroundColor: "#F2A20C", paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  primaryActionText: { color: "#000", fontWeight: "700", fontSize: 14 },
  secondaryAction: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, gap: 6 },
  secondaryActionText: { color: "#475569", fontWeight: "700", fontSize: 14 },
  reviewSection: { marginTop: 15, borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 15 },
  productReviewBox: { marginBottom: 15, backgroundColor: "#F8FAFC", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  productNameReview: { fontSize: 14, fontWeight: "700", color: "#1E293B" },
  starRow: { flexDirection: "row", marginVertical: 10, gap: 8 },
  reviewInput: { backgroundColor: "#FFF", borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 8, padding: 10, minHeight: 80, textAlignVertical: "top", color: "#1E293B" },
  submitReviewBtn: { backgroundColor: "#0F172A", marginTop: 12, paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  submitReviewText: { color: "#FFF", fontWeight: "700" },
  reviewedBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#DCFCE7", padding: 10, borderRadius: 8, marginTop: 10, gap: 8, justifyContent: "center" },
  reviewedBadgeText: { color: "#065F46", fontWeight: "700", fontSize: 14 },
  noProductsBox: { padding: 12, backgroundColor: "#FEF2F2", borderRadius: 8 },
  noProductsText: { color: "#B91C1C", fontSize: 13, textAlign: "center" },
  emptyTitle: { textAlign: "center", marginTop: 50, color: "#94A3B8" },
   headerIconBtn: {
    padding: 8,
  marginRight: 10,
    backgroundColor: "#ffffff",
    borderRadius: 12,
  },
  dateText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
  },
  cancelledDateText: {
    fontSize: 11,
    color: "#EF4444", 
    fontWeight: "600",
    marginTop: 2,
  },
});