import { useRouter } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  Headset,
  Plane,
  Star,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { categoryApi } from "../axios/axiosInstance";
import Footer from "../Component/footer";
import ProductCard from "../Component/productCard";
const PRODUCT_WIDTH = 240;
const CATEGORY_WIDTH = 100;
const { height, width } = Dimensions.get("window");
const BANNER_HEIGHT = height * 0.7;

const isWeb = Platform.OS === "web";
const isMobile = Platform.OS === "ios" || Platform.OS === "android";

interface Product {
  id: number;
  name: string;
  description: string;
  photoUrl: string;
  partNumber: string;
  company: string;
  actualPrice: number;
  discount: number;
  price: number;
  stockQuantity: number;
  rating: number | null;
  categoryName: string;
}

interface Category {
  id: number;
  name: string;
  photoUrl: string;
  isActive: boolean;
}

export default function HomePage() {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const categoryRef = useRef<FlatList>(null);
  const productRef = useRef<FlatList>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [productsLoading, setProductsLoading] = useState(true);

  const categoryX = useRef(0);
  const productX = useRef(0);
  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);

      const response = await categoryApi.get("/categories");

      if (!Array.isArray(response.data)) {
        setCategories([]);
        return;
      }

      const activeCats = response.data.filter(
        (cat: Category) => cat.isActive === true,
      );

      setCategories(activeCats);
    } catch (error: any) {
      console.error(
        "Error fetching categories:",
        error?.response?.data || error.message,
      );
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };
  const fetchProducts = async () => {
    try {
      setProductsLoading(true);

      const response = await categoryApi.get("/products", {
        params: { page: 0, size: 20, sort: "createdAt,desc" },
      });

      if (response.data && response.data.content) {
        setProducts(response.data.content);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };
 

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, BANNER_HEIGHT / 2],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const scrollHandler = (
    ref: any,
    currentX: any,
    width: number,
    direction: "L" | "R",
  ) => {
    const move = direction === "L" ? -width * 2 : width * 2;
    ref.current?.scrollToOffset({
      offset: Math.max(currentX.current + move, 0),
      animated: true,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        <View style={{ height: BANNER_HEIGHT, overflow: "hidden" }}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7",
            }}
            style={[styles.heroImage, { transform: [{ translateY: 0 }] }]}
          />
          <Animated.View style={[styles.overlay, { opacity: headerOpacity }]}>
            <Text style={styles.tagline}>PREMIUM AUTOMOBILE PARTS</Text>
            <Text style={styles.title}>Precision Parts.{"\n"}Delivered.</Text>
          </Animated.View>
        </View>

        <View style={styles.contentBody}>
          <View style={styles.floatingCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.heading}>Categories</Text>
              <View style={styles.arrowRow}>
                <TouchableOpacity
                  onPress={() =>
                    scrollHandler(categoryRef, categoryX, CATEGORY_WIDTH, "L")
                  }
                  style={styles.arrow}
                >
                  <ChevronLeft size={18} color="#333" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    scrollHandler(categoryRef, categoryX, CATEGORY_WIDTH, "R")
                  }
                  style={styles.arrow}
                >
                  <ChevronRight size={18} color="#333" />
                </TouchableOpacity>
              </View>
            </View>
            {loading ? (
              <ActivityIndicator color="#F2A20C" style={{ padding: 20 }} />
            ) : categories.length === 0 ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <Text style={{ color: "#999", fontWeight: "600" }}>
                  No categories found
                </Text>
              </View>
            ) : (
              <FlatList
                ref={categoryRef}
                data={categories}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  categoryX.current = e.nativeEvent.contentOffset.x;
                }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      styles.catCard,
                      activeCategory === item.name && styles.activeCatCard,
                    ]}
                    onPress={() => {
                      setActiveCategory(item.name);
                      router.push({
                        pathname: "/_components/CategoryDetails",
                        params: {
                          categoryName: item.name,
                          categoryId: item.id.toString(),
                        },
                      });
                    }}
                  >
                    <View style={styles.catImgWrapper}>
                      <Image
                        source={{ uri: item.photoUrl }}
                        style={styles.catImg}
                      />
                    </View>
                    <Text style={styles.catText} numberOfLines={2}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>

          <View style={styles.featuredSection}>
            <View style={[styles.sectionHeader, { paddingHorizontal: 20 }]}>
              <Text style={styles.heading}>Featured Products</Text>
              {/* <TouchableOpacity>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity> */}
            </View>
            {productsLoading ? (
              <ActivityIndicator color="#F2A20C" style={{ padding: 40 }} />
            ) : products.length === 0 ? (
              <View style={{ padding: 40, alignItems: "center" }}>
                <Text style={{ color: "#94A3B8" }}>No products available</Text>
              </View>
            ) : (
              <FlatList
                ref={productRef}
                data={products}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 20, paddingRight: 10 }}
                onScroll={(e) => {
                  productX.current = e.nativeEvent.contentOffset.x;
                }}
                renderItem={({ item }) => (
                  <View style={{ width: PRODUCT_WIDTH, marginRight: 15 }}>
                    <ProductCard
                      product={{
                        id: item.id.toString(),
                        name: item.name || "Unknown Product",

                        price:
                          item.price != null
                            ? `₹${item.price.toLocaleString()}`
                            : "Price N/A",
                        category: item.categoryName || "General",
                        image: item.photoUrl,
                        status:
                          item.stockQuantity > 10
                            ? "Active"
                            : item.stockQuantity > 0
                              ? "Low Stock"
                              : "Out of Stock",
                        stock: item.stockQuantity || 0,
                      }}
                      onAddToCart={() => {}}
                      onToggleWishlist={() => {}}
                      onView={() =>
                        router.push({
                          pathname: "./_components/ViewProductDetails",
                          params: { id: item.id },
                        })
                      }
                    />
                  </View>
                )}
              />
            )}
          </View>
        </View>

        <View
          style={[
            styles.serviceSection,
            {
              flexDirection: isWeb ? "row" : "column",

              marginTop: isMobile ? 20 : 40,
              backgroundColor: "#fff",
              borderRadius: 20,
              marginHorizontal: 20,
              paddingVertical: 25,

              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.03,
              shadowRadius: 10,
              elevation: 3,
            },
          ]}
        >
          {[
            {
              icon: <Plane size={24} color="#590080" />,
              title: "Free Home Delivery",
              sub: "Orders over $100",
            },
            {
              icon: <Star size={24} color="#590080" />,
              title: "Quality Products",
              sub: "100% Original parts",
            },
            {
              icon: <Headset size={24} color="#590080" />,
              title: "Online Support",
              sub: "24/7 technical help",
            },
          ].map((item, index) => (
            <React.Fragment key={index}>
              <View
                style={[
                  styles.serviceItem,
                  isMobile && { paddingVertical: 15, paddingHorizontal: 20 },
                  { justifyContent: isWeb ? "center" : "flex-start" },
                ]}
              >
                <View
                  style={{
                    backgroundColor: "#F5F3FF",
                    padding: 12,
                    borderRadius: 12,
                    marginRight: 15,
                  }}
                >
                  {item.icon}
                </View>

                <View style={styles.textContainer}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "800",
                      color: "#1E293B",
                      letterSpacing: -0.3,
                    }}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#64748B",
                      marginTop: 2,
                    }}
                  >
                    {item.sub}
                  </Text>
                </View>
              </View>

              {index !== 2 && (
                <View
                  style={
                    isWeb
                      ? {
                          width: 1,
                          height: 40,
                          backgroundColor: "#F1F5F9",
                          alignSelf: "center",
                        }
                      : {
                          height: 1,
                          width: "90%",
                          backgroundColor: "#F1F5F9",
                          alignSelf: "center",
                        }
                  }
                />
              )}
            </React.Fragment>
          ))}
        </View>
        <View style={{ marginTop: 40 }}>
          <Footer />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7F9" },
  heroImage: {
    height: Platform.OS === "web" ? BANNER_HEIGHT + 100 : 400,
    width: width,
    position: "absolute",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: Platform.OS === "web" ? 30 : 40,
    paddingBottom: Platform.OS === "web" ? 100 : 230,
  },
  tagline: {
    color: "#F2A20C",
    fontWeight: "700",
    letterSpacing: 2,
    fontSize: 12,
    marginBottom: 8,
  },
  title: {
    color: "#fff",
    fontSize: Platform.OS === "web" ? 42 : 35,
    fontWeight: "900",
    lineHeight: 48,
  },
  contentBody: {
    backgroundColor: "#F5F7F9",
    marginTop: Platform.OS === "web" ? -40 : -150,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  floatingCard: {
    backgroundColor: "#fff",
    borderRadius: 30,
    marginHorizontal: 20,
    marginTop: -60,
    padding: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  heading: { fontSize: 22, fontWeight: "800", color: "#1A1A1A" },
  arrowRow: { flexDirection: "row", gap: 8 },
  arrow: { backgroundColor: "#F0F2F5", padding: 8, borderRadius: 10 },
  catCard: {
    width: Platform.OS === "web" ? 85 : 80,
    alignItems: "center",
    marginRight: Platform.OS === "web" ? 15 : 10,
    margin: 2,
  },
  catImgWrapper: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  catImg: { width: 60, height: 60, borderRadius: 15 },
  catText: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "700",
    color: "#555",
    textAlign: "center",
  },
  featuredSection: { marginTop: 30 },
  seeAll: { color: "#B8860B", fontWeight: "700" },
  activeCatCard: { transform: [{ scale: 1.05 }] },

  // Service Section
  serviceSection: {
    paddingVertical: 40,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  serviceItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  serviceItemMobile: { width: "100%", paddingVertical: 15 },
  iconContainer: { marginRight: 15 },
  textContainer: { flex: 1 },
  serviceTitle: { fontSize: 15, fontWeight: "800", color: "#111" },
  serviceSub: { fontSize: 11, color: "#6b7280" },
  verticalDivider: { width: 1, height: 50, backgroundColor: "#e5e7eb" },
  horizontalDivider: {
    height: 1,
    width: "100%",
    backgroundColor: "#e5e7eb",
    marginVertical: 10,
  },

  // Promo Banners
  promoWrapper: { paddingHorizontal: 20, gap: 15, marginTop: 20 },
  promoCard: {
    flex: 1,
    height: 200,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 20,
    overflow: "hidden",
  },
  promoImageCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  promoInsetImg: { width: "100%", height: "100%", resizeMode: "cover" },
  promoContent: { flex: 1, paddingLeft: 20 },
  promoCodeText: { color: "#ccc", fontSize: 10 },
  boldCode: { fontWeight: "900", color: "#fff" },
  promoMainTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    marginVertical: 8,
  },
  shopBtn: {
    backgroundColor: "#E0E0E0",
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  shopBtnText: { fontSize: 10, fontWeight: "900", color: "#1A1A1A" },
  dialText: { color: "#ccc", fontSize: 10, fontStyle: "italic" },
});
