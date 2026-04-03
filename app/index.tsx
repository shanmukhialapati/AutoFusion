import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  SlideInRight,
  SlideOutRight,
} from "react-native-reanimated";
const NAV_TEXT = ["Home", "Shop", "Category"];

export default function ResponsiveNavbar() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ImageBackground
        source={{
          uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSZisl1GYvJ2IRJiIsaOrfeCVsGhODKe9006BpYA09&s",
        }}
        style={styles.heroImage}
        imageStyle={{ borderRadius: isMobile ? 0 : 20 }}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Text style={styles.logo}>Web Dev Creative</Text>

            {!isMobile ? (
              <View style={styles.desktopNav}>
                {NAV_TEXT.map((item) => (
                  <Text key={item} style={styles.navLink}>
                    {item}
                  </Text>
                ))}

                <View style={styles.iconGroup}>
                  <Ionicons
                    name="notifications-outline"
                    size={20}
                    color="white"
                  />
                  <Ionicons name="cart-outline" size={20} color="white" />
                  <Ionicons name="heart-outline" size={20} color="white" />
                  <Ionicons name="person-outline" size={20} color="white" />
                </View>

                <TouchableOpacity style={styles.getStartedBtnSmall}>
                  <Text style={styles.btnTextSmall}>Get Started</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setDrawerOpen(true)}>
                <Ionicons name="menu" size={30} color="white" />
              </TouchableOpacity>
            )}
          </View>

          {/* Hero Text */}
          <Animated.View entering={FadeIn.delay(300)} style={styles.content}>
            <Text style={styles.mainTitle}>Responsive Navbar</Text>
            <Text style={styles.subTitle}>HTML & CSS</Text>
          </Animated.View>
        </View>

        {/* Mobile Sidebar / Drawer */}
        {isMobile && drawerOpen && (
          <Animated.View
            entering={SlideInRight}
            exiting={SlideOutRight}
            style={styles.drawer}
          >
            <View style={styles.drawerHeader}>
              <Text style={styles.logo}>Web Dev Creative</Text>
              <TouchableOpacity onPress={() => setDrawerOpen(false)}>
                <Ionicons name="close" size={30} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.drawerLinks}>
              {NAV_TEXT.map((item, index) => (
                <Text
                  key={item}
                  style={[styles.drawerLink, index === 0 && styles.activeLink]}
                >
                  {item}
                </Text>
              ))}

              <View style={styles.drawerIcons}>
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color="white"
                />
                <Ionicons name="cart-outline" size={24} color="white" />
                <Ionicons name="heart-outline" size={24} color="white" />
                <Ionicons name="person-outline" size={24} color="white" />
              </View>

              <TouchableOpacity style={styles.getStartedBtnLarge}>
                <Text style={styles.btnText}>Get Started</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ImageBackground>
    </View>
  );
}
const PRIMARY = "#00e0ff";
const ACCENT = "#ff3b30";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f14",
    padding: 10,
  },

  heroImage: {
    flex: 1,
    overflow: "hidden",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(10, 15, 20, 0.53)",
    padding: 20,
  },

  /* 🔥 NAVBAR */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 70,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)", // glass effect
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  logo: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 1,
  },

  desktopNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 30,
  },

  navLink: {
    color: "#cfd8dc",
    fontSize: 15,
    fontWeight: "500",
  },

  activeNav: {
    color: PRIMARY,
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY,
    paddingBottom: 4,
  },

  iconGroup: {
    flexDirection: "row",
    gap: 18,
    marginLeft: 15,
  },

  /* 🔥 BUTTON */
  getStartedBtnSmall: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    shadowColor: PRIMARY,
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },

  btnTextSmall: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 13,
  },

  /* 🔥 HERO TEXT */
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  mainTitle: {
    color: "white",
    fontSize: 52,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 1,
  },

  subTitle: {
    color: "#b0bec5",
    fontSize: 20,
    marginTop: 8,
  },

  /* 🔥 DRAWER */
  drawer: {
    position: "absolute",
    top: 10,
    right: 10,
    bottom: 10,
    width: "85%",
    backgroundColor: "#111821",
    borderRadius: 25,
    padding: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 40,
  },

  drawerLinks: {
    alignItems: "center",
    gap: 28,
  },

  drawerLink: {
    color: "#cfd8dc",
    fontSize: 20,
    fontWeight: "500",
  },

  activeLink: {
    color: PRIMARY,
  },

  drawerIcons: {
    flexDirection: "row",
    gap: 25,
    marginTop: 20,
    paddingVertical: 20,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "rgba(255,255,255,0.15)",
    width: "100%",
    justifyContent: "center",
  },

  getStartedBtnLarge: {
    backgroundColor: PRIMARY,
    width: "100%",
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 20,
  },

  btnText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
});
