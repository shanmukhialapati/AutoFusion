import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
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

interface Item {
  id: string;
  name: string;
  image: string;
}
interface Category {
  id: string;
  name: string;
  subSections: Item[];
}

const CATEGORY_TREE: Category[] = [
  {
    id: "c1",
    name: "Engine",
    subSections: [
      {
        id: "1",
        name: "Pistons",
        image: "https://images.unsplash.com/photo-1606220838315-056192d5e927",
      },
      {
        id: "2",
        name: "Spark Plugs",
        image: "https://images.unsplash.com/photo-1621905252472-e8c0b92d5e7b",
      },
      {
        id: "3",
        name: "Turbo Chargers",
        image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537",
      },
      {
        id: "4",
        name: "Valves",
        image: "https://images.unsplash.com/photo-1593941707882-a56bbc8f7d8c",
      },
      {
        id: "5",
        name: "Cylinder Head",
        image: "https://images.unsplash.com/photo-1625047509168-a7026f36de04",
      },
    ],
  },

  {
    id: "c2",
    name: "Brake System",
    subSections: [
      {
        id: "6",
        name: "Brake Pads",
        image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e",
      },
      {
        id: "7",
        name: "Disc Rotors",
        image: "https://images.unsplash.com/photo-1625047509056-33cce3f8f2ff",
      },
      {
        id: "8",
        name: "Brake Calipers",
        image: "https://images.unsplash.com/photo-1581092335878-0c4b1c1f9c2d",
      },
      {
        id: "9",
        name: "Brake Fluid",
        image: "https://images.unsplash.com/photo-1581093588401-22d52c6f3c5f",
      },
    ],
  },

  {
    id: "c3",
    name: "Filters",
    subSections: [
      {
        id: "10",
        name: "Oil Filter",
        image: "https://images.unsplash.com/photo-1581092588429-0a5d4c6c9d9e",
      },
      {
        id: "11",
        name: "Air Filter",
        image: "https://images.unsplash.com/photo-1625047509242-ec889b6bfa2c",
      },
      {
        id: "12",
        name: "Cabin Filter",
        image: "https://images.unsplash.com/photo-1606220838315-056192d5e927",
      },
      {
        id: "13",
        name: "Fuel Filter",
        image: "https://images.unsplash.com/photo-1597764690523-15bea4c581c9",
      },
    ],
  },

  {
    id: "c4",
    name: "Suspension and Arms",
    subSections: [
      {
        id: "14",
        name: "Shock Absorbers",
        image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e",
      },
      {
        id: "15",
        name: "Control Arms",
        image: "https://images.unsplash.com/photo-1581092335878-0c4b1c1f9c2d",
      },
      {
        id: "16",
        name: "Ball Joints",
        image: "https://images.unsplash.com/photo-1625047509168-a7026f36de04",
      },
    ],
  },

  {
    id: "c5",
    name: "Lighting",
    subSections: [
      {
        id: "17",
        name: "Headlights",
        image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70",
      },
      {
        id: "18",
        name: "Tail Lights",
        image: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c",
      },
      {
        id: "19",
        name: "Fog Lamps",
        image: "https://images.unsplash.com/photo-1549921296-3a6b4b3b1e9c",
      },
    ],
  },

  {
    id: "c6",
    name: "Interior and Comfort",
    subSections: [
      {
        id: "20",
        name: "Seat Covers",
        image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6",
      },
      {
        id: "21",
        name: "Steering Covers",
        image: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c",
      },
      {
        id: "22",
        name: "Floor Mats",
        image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6",
      },
    ],
  },

  {
    id: "c7",
    name: "Tyres and Alloys",
    subSections: [
      {
        id: "23",
        name: "Alloy Wheels",
        image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2",
      },
      {
        id: "24",
        name: "Car Tyres",
        image: "https://images.unsplash.com/photo-1558981403-c5f9891c7f06",
      },
      {
        id: "25",
        name: "Wheel Covers",
        image: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a",
      },
    ],
  },

  {
    id: "c8",
    name: "Oils and Fluids",
    subSections: [
      {
        id: "26",
        name: "Engine Oil",
        image: "https://images.unsplash.com/photo-1581092588429-0a5d4c6c9d9e",
      },
      {
        id: "27",
        name: "Coolant",
        image: "https://images.unsplash.com/photo-1581093588401-22d52c6f3c5f",
      },
      {
        id: "28",
        name: "Brake Oil",
        image: "https://images.unsplash.com/photo-1581093588401-22d52c6f3c5f",
      },
    ],
  },

  {
    id: "c9",
    name: "Transmission",
    subSections: [
      {
        id: "29",
        name: "Clutch Plates",
        image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537",
      },
      {
        id: "30",
        name: "Gearbox",
        image: "https://images.unsplash.com/photo-1625047509056-33cce3f8f2ff",
      },
    ],
  },
];

/* ================== GRID ITEM ================== */
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

/* ================== MAIN COMPONENT ================== */
export default function CategoryDetails() {
  const router = useRouter();
  const { categoryName } = useLocalSearchParams();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1024;
  const isMobile = width < 768;

  const [activeCat, setActiveCat] = useState<string>(
    (categoryName as string) || "Engine",
  );
  const [showDrawer, setShowDrawer] = useState(false);

  const data = useMemo(() => {
    return CATEGORY_TREE.find((c) => c.name === activeCat)?.subSections || [];
  }, [activeCat]);

  // Adjust columns based on platform if using vertical grid
  const numColumns = isDesktop ? 4 : isMobile ? 2 : 3;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconCircle}
          >
            <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <View>
            <Text style={styles.tagline}>COLLECTION</Text>
            <Text style={styles.title}>{activeCat}</Text>
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
            {CATEGORY_TREE.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setActiveCat(cat.name)}
                style={[
                  styles.sidebarItem,
                  activeCat === cat.name && styles.activeSidebar,
                ]}
              >
                <Text
                  style={[
                    styles.sidebarText,
                    activeCat === cat.name && styles.activeSidebarText,
                  ]}
                >
                  {cat.name}
                </Text>
                {activeCat === cat.name && (
                  <View style={styles.activeIndicator} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View
          style={[styles.content, isDesktop && { borderTopLeftRadius: 30 }]}
        >
          <FlatList
            data={data}
            key={numColumns} // Key changes force re-render when columns change
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            columnWrapperStyle={data.length > 1 ? styles.row : null}
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => (
              <GridItem
                item={item}
                index={index}
                isDesktop={isDesktop}
                onPress={() => console.log("Selected:", item.name)}
              />
            )}
          />
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
            <ScrollView>
              {CATEGORY_TREE.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => {
                    setActiveCat(cat.name);
                    setShowDrawer(false);
                  }}
                  style={[
                    styles.drawerItem,
                    activeCat === cat.name && styles.activeDrawerItem,
                  ]}
                >
                  <Text
                    style={[
                      styles.drawerText,
                      activeCat === cat.name && { color: "#FFD700" },
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
  activeSidebarText: { color: "#FFD700", fontWeight: "700" },
  activeIndicator: {
    width: 4,
    height: 20,
    backgroundColor: "#FFD700",
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
    right: 0,
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
});
