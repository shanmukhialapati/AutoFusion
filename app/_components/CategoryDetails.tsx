import { categoryApi } from "@/axios/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

const GridItem = ({ item, index, isDesktop, onPress }: any) => {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [item]);

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        { opacity, transform: [{ scale }] },
        isDesktop ? styles.desktopCardWidth : styles.mobileCardWidth,
      ]}
    >
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={onPress}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.image }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
        <Text style={styles.cardText} numberOfLines={2}>
          {item.name}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

export default function CategoryDetails() {
  const router = useRouter();
  const { categoryId, categoryName } = useLocalSearchParams();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1024;
  const isMobile = width < 768;

  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [activeCatId, setActiveCatId] = useState<string>(categoryId as string);
  const [activeCatName, setActiveCatName] = useState<string>(
    categoryName as string,
  );
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);

  const numColumns = isDesktop ? 4 : isMobile ? 2 : 3;

  useEffect(() => {
    fetchAllCategories();
  }, []);

  useEffect(() => {
    if (activeCatId) {
      fetchSubCategories();
    }
  }, [activeCatId]);

  const fetchAllCategories = async () => {
    try {
      const response = await categoryApi.get("/categories");
      setCategories(response.data);

      if (!activeCatId && response.data.length > 0) {
        setActiveCatId(response.data[0].id.toString());
        setActiveCatName(response.data[0].name);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSubCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryApi.get(
        `/subcategories/category/${activeCatId}`,
      );

      const formatted = response.data.map((item: any) => ({
        id: item.id.toString(),
        name: item.name,
        image: item.photoUrl,
      }));

      setSubCategories(formatted);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      setSubCategories([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.push("/")}
            style={styles.iconCircle}
          >
            <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <View>
            <Text style={styles.tagline}>COLLECTION</Text>
            <Text style={styles.title}>{activeCatName || "Loading..."}</Text>
          </View>
        </View>

        {!isDesktop && (
          <TouchableOpacity
            onPress={() => setShowDrawer(true)}
            style={styles.iconCircle}
          >
            <Ionicons name="menu-outline" size={24} color="#B8860B" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.mainLayout}>
        {isDesktop && (
          <View style={styles.sidebar}>
            <Text style={styles.sidebarHeader}>CATEGORIES</Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => {
                    setActiveCatId(cat.id.toString());
                    setActiveCatName(cat.name);
                  }}
                  style={[
                    styles.sidebarItem,
                    activeCatId === cat.id.toString() && styles.activeSidebar,
                  ]}
                >
                  <Text
                    style={[
                      styles.sidebarText,
                      activeCatId === cat.id.toString() &&
                        styles.activeSidebarText,
                    ]}
                  >
                    {cat.name}
                  </Text>
                  {activeCatId === cat.id.toString() && (
                    <View style={styles.activeIndicator} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View
          style={[styles.content, isDesktop && { borderTopLeftRadius: 30 }]}
        >
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#B8860B" />
            </View>
          ) : (
            <FlatList
              data={subCategories}
              key={numColumns}
              keyExtractor={(item) => item.id}
              numColumns={numColumns}
              columnWrapperStyle={subCategories.length > 1 ? styles.row : null}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={50} color="#CCC" />
                  <Text style={styles.emptyTitle}>No Subcategories Found</Text>
                  <Text style={styles.emptySubtitle}>
                    We couldn't find any items in this category.
                  </Text>
                </View>
              )}
              renderItem={({ item, index }) => (
                <GridItem
                  item={item}
                  index={index}
                  isDesktop={isDesktop}
                  onPress={() => {
                    router.push({
                      pathname: "./productsDetails",
                      params: {
                        subCategoryId: item.id,
                        subCategoryName: item.name,
                        parentCategory: activeCatName,
                        parentCategoryId: activeCatId,
                      },
                    });
                  }}
                />
              )}
            />
          )}
        </View>
      </View>

      {showDrawer && (
        <View style={styles.drawerOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowDrawer(false)}
          />
          <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowDrawer(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => {
                    setActiveCatId(cat.id.toString());
                    setActiveCatName(cat.name);
                    setShowDrawer(false);
                  }}
                  style={[
                    styles.drawerItem,
                    activeCatId === cat.id.toString() &&
                      styles.activeDrawerItem,
                  ]}
                >
                  <Text
                    style={[
                      styles.drawerText,
                      activeCatId === cat.id.toString() && {
                        color: "#F2A20C",
                      },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F3F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  tagline: {
    fontSize: 10,
    fontWeight: "700",
    color: "#B8860B",
    letterSpacing: 1,
  },
  title: { fontWeight: "900", fontSize: 22, color: "#1A1A1A" },
  mainLayout: { flex: 1, flexDirection: "row" },

  sidebar: { width: 260, backgroundColor: "#1A1A1A", paddingTop: 20 },
  sidebarHeader: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sidebarItem: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sidebarText: { color: "#ADB5BD", fontSize: 15, fontWeight: "500" },
  activeSidebar: { backgroundColor: "rgba(255,215,0,0.1)" },
  activeSidebarText: { color: "#F2A20C", fontWeight: "700" },
  activeIndicator: {
    width: 4,
    height: 20,
    backgroundColor: "#F2A20C",
    borderRadius: 2,
  },

  content: { flex: 1, backgroundColor: "#fff" },
  listContent: { padding: 10, paddingBottom: 100 },
  row: { justifyContent: "flex-start" },

  cardWrapper: { padding: 10 },
  desktopCardWidth: { width: "25%" },
  mobileCardWidth: { width: "50%" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F3F5",
    ...Platform.select({
      web: { cursor: "pointer" },
      ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  cardPressed: { transform: [{ scale: 0.95 }], opacity: 0.8 },
  imageContainer: {
    width: "100%",
    height: 120,
    backgroundColor: "#f1f1f1",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  image: { width: "85%", height: "85%", borderRadius: 10 },
  cardText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
  },

  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 100,
  },
  drawer: {
    width: 300,
    backgroundColor: "#1A1A1A",
    height: "100%",
    position: "absolute",
    left: 0,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 25,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  drawerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  drawerItem: { padding: 20, borderBottomWidth: 1, borderBottomColor: "#222" },
  activeDrawerItem: { backgroundColor: "#333" },
  drawerText: { color: "#fff", fontSize: 16 },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#444",
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 5,
    paddingHorizontal: 20,
  },
});
