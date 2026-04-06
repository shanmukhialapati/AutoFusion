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
  id: string;
  name: string;
  price: string;
  category: string;
  status: "Active" | "Low Stock" | "Out of Stock";
  stock: number;
  image: string;
}

// const CATEGORIES = [
//   {
//     id: "c1",
//     name: "Engine",
//     image:
//       "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80",
//   },
//   {
//     id: "c2",
//     name: "Brake System",
//     image:
//       "https://images.unsplash.com/photo-1613214150384-14921ff659b2?auto=format&fit=crop&w=800&q=80",
//   },
//   {
//     id: "c3",
//     name: "Suspension and Arms",
//     image:
//       "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=800&q=80",
//   },
//   {
//     id: "c4",
//     name: "Lighting",
//     image:
//       "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80",
//   },
//   {
//     id: "c5",
//     name: "Interior and comfort",
//     image:
//       "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
//   },
//   {
//     id: "c6",
//     name: "Wheels",
//     image:
//       "https://images.unsplash.com/photo-1551522435-a13afa10f103?auto=format&fit=crop&w=800&q=80",
//   },
//   {
//     id: "c7",
//     name: "Air Conditioning",
//     image:
//       "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=800&q=80",
//   },
//   {
//     id: "c8",
//     name: "Fuel Supply System",
//     image:
//       "https://images.unsplash.com/photo-1604147706283-9d7c5c2c8b3e?auto=format&fit=crop&w=800&q=80",
//   },
//   {
//     id: "c9",
//     name: "Sensors Relays and Control units",
//     image:
//       "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80",
//   },
//   {
//     id: "c10",
//     name: "Oils and Fluids",
//     image:
//       "https://images.unsplash.com/photo-1604335399105-a0c585fd81a9?auto=format&fit=crop&w=800&q=80",
//   },
//   {
//     id: "c11",
//     name: "Filters",
//     image:
//       "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80",
//   },
//   {
//     id: "c12",
//     name: "Exhaust System",
//     image:
//       "https://images.unsplash.com/photo-1597007030739-6d2e1b3f9b4f?auto=format&fit=crop&w=800&q=80",
//   },
//   {
//     id: "c13",
//     name: "Transmission",
//     image:
//       "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80",
//   },
//   {
//     id: "c14",
//     name: "Steering",
//     image:
//       "https://images.unsplash.com/photo-1603386329225-868f9b1c6b2f?auto=format&fit=crop&w=800&q=80",
//   },
//   {
//     id: "c15",
//     name: "Car Accessories",
//     image:
//       "https://images.unsplash.com/photo-1625047509168-a7026f36de04?auto=format&fit=crop&w=800&q=80",
//   },
// ];
interface Category {
  id: number;
  name: string;
  photoUrl: string;
  isActive: boolean;
}
const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Brembo Brake Kit",
    price: "₹45000",
    category: "Brakes",
    status: "Active",
    stock: 12,
    image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837",
  },
  {
    id: "2",
    name: "NGK Spark Plug",
    price: "₹2800",
    category: "Engine",
    status: "Low Stock",
    stock: 5,
    image: "https://images.unsplash.com/photo-1621905235212-3204968858a7",
  },
  {
    id: "3",
    name: "Alloy Wheels",
    price: "₹12000",
    category: "Wheels",
    status: "Active",
    stock: 20,
    image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2",
  },
  {
    id: "4",
    name: "LED Headlights",
    price: "₹3500",
    category: "Lights",
    status: "Out of Stock",
    stock: 0,
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70",
  },
  {
    id: "1",
    name: "Brembo Brake Kit",
    price: "₹45000",
    category: "Brakes",
    status: "Active",
    stock: 12,
    image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837",
  },
  {
    id: "2",
    name: "NGK Spark Plug",
    price: "₹2800",
    category: "Engine",
    status: "Low Stock",
    stock: 5,
    image: "https://images.unsplash.com/photo-1621905235212-3204968858a7",
  },
  {
    id: "3",
    name: "Alloy Wheels",
    price: "₹12000",
    category: "Wheels",
    status: "Active",
    stock: 20,
    image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2",
  },
  {
    id: "4",
    name: "LED Headlights",
    price: "₹3500",
    category: "Lights",
    status: "Out of Stock",
    stock: 0,
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70",
  },
];

export default function HomePage() {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const categoryRef = useRef<FlatList>(null);
  const productRef = useRef<FlatList>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categoryX = useRef(0);
  const productX = useRef(0);
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);

      const response = await categoryApi.get("/categories");

      console.log("API DATA:", response.data);

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
  const headerTranslate = scrollY.interpolate({
    inputRange: [0, BANNER_HEIGHT],
    outputRange: [0, -BANNER_HEIGHT / 3],
    extrapolate: "clamp",
  });

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
        {/* Hero Section */}
        <View style={{ height: BANNER_HEIGHT, overflow: "hidden" }}>
          <Animated.Image
            source={{
              uri: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7",
            }}
            style={[
              styles.heroImage,
              { transform: [{ translateY: headerTranslate }] },
            ]}
          />
          <Animated.View style={[styles.overlay, { opacity: headerOpacity }]}>
            <Text style={styles.tagline}>PREMIUM AUTOMOBILE PARTS</Text>
            <Text style={styles.title}>Precision Parts.{"\n"}Delivered.</Text>
          </Animated.View>
        </View>

        <View style={styles.contentBody}>
          {/* Categories Section */}
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
              <ActivityIndicator color="#590080" style={{ padding: 20 }} />
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
                          categoryId: item.id.toString(), // PASS THE ID HERE
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

          {/* Featured Section */}
          <View style={styles.featuredSection}>
            <View style={[styles.sectionHeader, { paddingHorizontal: 20 }]}>
              <Text style={styles.heading}>Featured Products</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              ref={productRef}
              data={PRODUCTS}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 20, paddingRight: 10 }}
              onScroll={(e) => {
                productX.current = e.nativeEvent.contentOffset.x;
              }}
              renderItem={({ item }) => (
                <View style={{ width: PRODUCT_WIDTH, marginRight: 15 }}>
                  <ProductCard
                    product={item}
                    onAddToCart={() => {}}
                    onToggleWishlist={() => {}}
                    onView={() => {}}
                  />
                </View>
              )}
            />
          </View>
        </View>

        <View
          style={[
            styles.serviceSection,
            {
              flexDirection: isWeb ? "row" : "column",
              // Adding a slight lift to the section
              marginTop: isMobile ? 20 : 40,
              backgroundColor: "#fff",
              borderRadius: 20,
              marginHorizontal: 20,
              paddingVertical: 25,
              // Professional shadow
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
              icon: <Plane size={24} color="#590080" />, // Matching your brand purple
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
                {/* Soft background for the icon */}
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

              {/* Divider logic */}
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
    height: BANNER_HEIGHT + 100,
    width: width,
    position: "absolute",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 30,
  },
  tagline: {
    color: "#FFD700",
    fontWeight: "700",
    letterSpacing: 2,
    fontSize: 12,
    marginBottom: 8,
  },
  title: { color: "#fff", fontSize: 42, fontWeight: "900", lineHeight: 48 },
  contentBody: {
    backgroundColor: "#F5F7F9",
    marginTop: -40,
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
    marginBottom: 15,
  },
  heading: { fontSize: 22, fontWeight: "800", color: "#1A1A1A" },
  arrowRow: { flexDirection: "row", gap: 8 },
  arrow: { backgroundColor: "#F0F2F5", padding: 8, borderRadius: 10 },
  catCard: { width: 85, alignItems: "center", marginRight: 15 },
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
