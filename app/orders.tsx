import { cartApi } from "@/axios/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const STATUS_MAP: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  PLACED: { label: "Placed", color: "#3B82F6", icon: "cube-outline" },
  DISPATCHED: {
    label: "Dispatched",
    color: "#8B5CF6",
    icon: "airplane-outline",
  },
  DELIVERED: {
    label: "Delivered",
    color: "#10B981",
    icon: "checkmark-done-circle-outline",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "#EF4444",
    icon: "close-circle-outline",
  },
  PAYMENT_PENDING: { label: "Pending", color: "#F59E0B", icon: "time-outline" },
};

const FILTERS = [
  "All",
  "PLACED",
  "DISPATCHED",
  "DELIVERED",
  "CANCELLED",
  "PAYMENT_PENDING",
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [comments, setComments] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<number | null>(null);

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
  }, [fetchOrders]);

  const handleMarkDelivered = async (orderId: number) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await cartApi.patch(`/orders/deliver/${orderId}`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 200) {
        Alert.alert("Success", "Order marked as received!");
        setOrders((prev) =>
          prev.map((o) =>
            o.orderId === orderId ? { ...o, orderStatus: "DELIVERED" } : o,
          ),
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update status.");
    }
  };

  const handlePostReview = async (productId: number, orderId: number) => {
    const rating = ratings[productId] || 0;
    const comment = comments[productId] || "";

    if (rating === 0) {
      Alert.alert("Rating Required", "Please select a star rating.");
      return;
    }

    try {
      setIsSubmitting(productId);
      const token = await AsyncStorage.getItem("token");
      const payload = { productId, orderId, rating, comment };

      await cartApi.post("/reviews", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert("Success", "Your review has been posted!");
      setRatings((prev) => ({ ...prev, [productId]: 0 }));
      setComments((prev) => ({ ...prev, [productId]: "" }));
    } catch (error) {
      Alert.alert("Error", "Could not submit review.");
    } finally {
      setIsSubmitting(null);
    }
  };

  const filteredOrders = useMemo(() => {
    if (activeFilter === "All") return orders;
    return orders.filter((o) => o.orderStatus === activeFilter);
  }, [activeFilter, orders]);

  const renderOrderCard = ({ item }: { item: any }) => {
    const status = STATUS_MAP[item.orderStatus] || {
      label: item.orderStatus,
      color: "#94A3B8",
      icon: "help-circle-outline",
    };
    const isExpanded = expandedOrderId === item.orderId;
    const orderItems = item.orderItems || [];

    return (
      <View style={styles.orderCard}>
        <View
          style={[styles.statusIndicator, { backgroundColor: status.color }]}
        />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.orderId}>Order #{item.orderId}</Text>
              <Text style={styles.paymentText}>
                {item.paymentMode} • {orderItems.length} Products
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${status.color}15` },
              ]}
            >
              <Ionicons
                name={status.icon as any}
                size={14}
                color={status.color}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />
          <Text style={styles.metaLabel}>Total Price</Text>
          <Text style={styles.totalPrice}>${item.finalAmount?.toFixed(2)}</Text>

          <View style={styles.actionContainer}>
            {/* MATCHING DISPATCHED STATUS FROM JSON */}
            {item.orderStatus === "DISPATCHED" && (
              <Pressable
                style={styles.primaryAction}
                onPress={() => handleMarkDelivered(item.orderId)}
              >
                <Text style={styles.primaryActionText}>Mark as Received</Text>
              </Pressable>
            )}

            {item.orderStatus === "DELIVERED" && (
              <Pressable
                style={styles.secondaryAction}
                onPress={() =>
                  setExpandedOrderId(isExpanded ? null : item.orderId)
                }
              >
                <Ionicons
                  name={isExpanded ? "chevron-up" : "star-outline"}
                  size={16}
                  color="#475569"
                />
                <Text style={styles.secondaryActionText}>
                  {isExpanded ? "Hide Review" : "Write Review"}
                </Text>
              </Pressable>
            )}
          </View>

          {isExpanded && (
            <View style={styles.reviewSection}>
              {orderItems.length > 0 ? (
                orderItems.map((prod: any) => (
                  <View key={prod.productId} style={styles.productReviewBox}>
                    <Text style={styles.productNameReview}>{prod.pname}</Text>
                    <View style={styles.starRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Pressable
                          key={star}
                          onPress={() =>
                            setRatings((p) => ({
                              ...p,
                              [prod.productId]: star,
                            }))
                          }
                        >
                          <Ionicons
                            name={
                              (ratings[prod.productId] || 0) >= star
                                ? "star"
                                : "star-outline"
                            }
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
                      onChangeText={(t) =>
                        setComments((p) => ({ ...p, [prod.productId]: t }))
                      }
                      multiline
                    />
                    <Pressable
                      style={[
                        styles.submitReviewBtn,
                        (ratings[prod.productId] || 0) === 0 && {
                          opacity: 0.5,
                        },
                      ]}
                      onPress={() =>
                        handlePostReview(prod.productId, item.orderId)
                      }
                      disabled={isSubmitting === prod.productId}
                    >
                      {isSubmitting === prod.productId ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <Text style={styles.submitReviewText}>
                          Submit Review
                        </Text>
                      )}
                    </Pressable>
                  </View>
                ))
              ) : (
                <View style={styles.noProductsBox}>
                  <Text style={styles.noProductsText}>
                    No items found in this order.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.welcomeText}>My Purchases</Text>
        <Pressable onPress={fetchOrders} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color="#0F172A" />
        </Pressable>
      </View>
      <View style={{ height: 50 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        >
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[
                styles.filterChip,
                activeFilter === f && styles.activeChip,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === f && styles.activeFilterText,
                ]}
              >
                {f === "All" ? "All" : STATUS_MAP[f]?.label || f}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.orderId.toString()}
        renderItem={renderOrderCard}
        contentContainerStyle={styles.listPadding}
        ListEmptyComponent={
          <Text style={styles.emptyTitle}>No orders found</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  welcomeText: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  refreshBtn: {
    padding: 8,
    backgroundColor: "#FFF",
    borderRadius: 10,
    elevation: 2,
  },
  filterList: { paddingHorizontal: 20, gap: 8, marginBottom: 10 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#E2E8F0",
  },
  activeChip: { backgroundColor: "#0F172A" },
  filterText: { fontSize: 13, fontWeight: "600", color: "#475569" },
  activeFilterText: { color: "#FFF" },
  listPadding: { paddingHorizontal: 20, paddingBottom: 40 },
  orderCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: "row",
    overflow: "hidden",
    elevation: 3,
  },
  statusIndicator: { width: 5 },
  cardContent: { flex: 1, padding: 16 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  orderId: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  paymentText: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 12 },
  metaLabel: {
    fontSize: 10,
    color: "#94A3B8",
    textTransform: "uppercase",
    fontWeight: "700",
  },
  totalPrice: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  actionContainer: { marginTop: 15 },
  primaryAction: {
    backgroundColor: "#F2A20C",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryActionText: { color: "#000", fontWeight: "700", fontSize: 14 },
  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 6,
  },
  secondaryActionText: { color: "#475569", fontWeight: "700", fontSize: 14 },
  reviewSection: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 15,
  },
  productReviewBox: {
    marginBottom: 15,
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  productNameReview: { fontSize: 14, fontWeight: "700", color: "#1E293B" },
  starRow: { flexDirection: "row", marginVertical: 10, gap: 8 },
  reviewInput: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    textAlignVertical: "top",
    color: "#1E293B",
  },
  submitReviewBtn: {
    backgroundColor: "#0F172A",
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  submitReviewText: { color: "#FFF", fontWeight: "700" },
  noProductsBox: { padding: 12, backgroundColor: "#FEF2F2", borderRadius: 8 },
  noProductsText: { color: "#B91C1C", fontSize: 13, textAlign: "center" },
  emptyTitle: { textAlign: "center", marginTop: 50, color: "#94A3B8" },
});
