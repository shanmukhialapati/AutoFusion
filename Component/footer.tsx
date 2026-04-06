import { FontAwesome, FontAwesome6 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import React, { useState } from "react";
import {
  Dimensions,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const isMobile = width < 768;

interface InfoContent {
  title: string;
  content: string;
}

const Footer = () => {
  const [selectedInfo, setSelectedInfo] = useState<InfoContent | null>(null);
  const router = useRouter();

  const infoData: Record<string, InfoContent> = {
    "About Us": {
      title: "OUR HERITAGE",
      content:
        "AUTOFUSION started in a small garage in Detroit with one goal: precision. Today, we supply the world with high-performance parts.",
    },
    Support: {
      title: "24/7 TECHNICAL HELP",
      content:
        "Our master mechanics are available via live chat or phone (1-800-AUTO) to help with your build.",
    },
    "Contact Us": {
      title: "GET IN TOUCH",
      content:
        "Email: support@autofusion.com | Phone: 1-800-AUTO-FUSE | Location: Detroit Tech Hub.",
    },
  };

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Cart", path: "/cart" },
    { label: "Wishlist", path: "/wishlist" },
    { label: "Orders", path: "/orders" },
  ];

  const openLink = (url: string) => Linking.openURL(url);

  return (
    <View style={styles.container}>
      {/* --- FLOATING INFO PANEL --- */}
      {selectedInfo && (
        <View style={styles.floatingInfo}>
          <View style={styles.infoInner}>
            <View style={styles.infoTextSide}>
              <Text style={styles.infoTitle}>{selectedInfo.title}</Text>
              <Text style={styles.infoContentText}>{selectedInfo.content}</Text>
            </View>
            <Pressable
              onPress={() => setSelectedInfo(null)}
              style={styles.infoCloseBtn}
            >
              <X size={20} color="#000" />
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.contentPadding}>
        <View style={styles.mainGrid}>
          {/* Brand & Mission */}
          <View style={styles.brandSection}>
            <Text style={styles.brandName}>AUTOFUSION</Text>
            <Text style={styles.brandTagline}>
              ENGINEERING THE FUTURE OF PERFORMANCE.
            </Text>
            <View style={styles.socialRow}>
              {["facebook", "instagram", "x-twitter"].map((icon, i) => (
                <Pressable key={i} style={styles.socialCircle}>
                  {icon === "x-twitter" ? (
                    <FontAwesome6 name={icon} size={16} color="#AAA" />
                  ) : (
                    <FontAwesome name={icon as any} size={18} color="#AAA" />
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Links Grid */}
          <View style={styles.linksContainer}>
            <View style={styles.linkCol}>
              <Text style={styles.header}>SHOP</Text>
              {navLinks.map((item) => (
                <Pressable
                  key={item.label}
                  onPress={() => router.push(item.path as any)}
                  style={styles.linkPress}
                >
                  <Text style={styles.linkText}>{item.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.linkCol}>
              <Text style={styles.header}>COMPANY</Text>
              {["About Us", "Support", "Contact Us"].map((label) => (
                <Pressable
                  key={label}
                  onPress={() => setSelectedInfo(infoData[label])}
                  style={styles.linkPress}
                >
                  <Text style={styles.linkText}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* --- STORE DOWNLOAD BAR --- */}
      <View style={styles.downloadBar}>
        <Text style={styles.downloadHeading}>SYNC WITH YOUR GARAGE</Text>
        <View style={styles.btnGroup}>
          <Pressable
            style={styles.storeBtn}
            onPress={() => openLink("https://apple.com")}
          >
            <FontAwesome name="apple" size={22} color="black" />
            <View style={styles.btnLabel}>
              <Text style={styles.btnTopText}>App Store</Text>
            </View>
          </Pressable>
          <Pressable
            style={[styles.storeBtn, { backgroundColor: "#F2A20C" }]}
            onPress={() => openLink("https://google.com")}
          >
            <FontAwesome name="play" size={18} color="black" />
            <View style={styles.btnLabel}>
              <Text style={styles.btnTopText}>Google Play</Text>
            </View>
          </Pressable>
        </View>
      </View>

      <View style={styles.bottomStatus}>
        <Text style={styles.copyText}>© 2026 AUTOFUSION INDUSTRIES</Text>
        <View style={styles.badge}>
          <View style={styles.dot} />
          <Text style={styles.badgeText}>SYSTEMS ONLINE</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#121212",
    borderTopWidth: 1,
    borderColor: "#222",
  },
  contentPadding: { paddingHorizontal: 24, paddingVertical: 50 },

  mainGrid: {
    flexDirection: isMobile ? "column" : "row",
    justifyContent: "space-between",
  },
  brandSection: { maxWidth: 300, marginBottom: 40 },
  brandName: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 2,
  },
  brandTagline: {
    color: "#666",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 8,
    letterSpacing: 1,
  },

  linksContainer: {
    flexDirection: "row",
    flex: 1,
    justifyContent: isMobile ? "space-between" : "space-evenly",
  },
  linkCol: { minWidth: 120 },
  header: {
    color: "#F2A20C",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  linkPress: { marginBottom: 14 },
  linkText: { color: "#AAA", fontSize: 13, fontWeight: "600" },

  // Socials
  socialRow: { flexDirection: "row", gap: 12, marginTop: 25 },
  socialCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#333",
  },

  floatingInfo: {
    position: "absolute",
    top: -20,
    left: 20,
    right: 20,
    zIndex: 100,
    backgroundColor: "#F2A20C",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  infoInner: { flexDirection: "row", padding: 20, alignItems: "center" },
  infoTextSide: { flex: 1 },
  infoTitle: {
    color: "#000",
    fontWeight: "900",
    fontSize: 14,
    marginBottom: 4,
  },
  infoContentText: {
    color: "#333",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },
  infoCloseBtn: {
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 20,
  },

  // Download Bar
  downloadBar: {
    backgroundColor: "#000",
    paddingVertical: 30,
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#1A1A1A",
  },
  downloadHeading: {
    color: "#444",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 20,
  },
  btnGroup: { flexDirection: "row", gap: 12 },
  storeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    minWidth: 140,
    justifyContent: "center",
  },
  btnLabel: { marginLeft: 8 },
  btnTopText: { fontSize: 13, fontWeight: "900", color: "#000" },

  bottomStatus: {
    height: 50,
    backgroundColor: "#1f1d1dcf",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderColor: "#111",
  },
  copyText: { color: "#9a9999", fontSize: 10, fontWeight: "700" },
  badge: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#0F0" },
  badgeText: { color: "#444", fontSize: 9, fontWeight: "900" },
});

export default Footer;
