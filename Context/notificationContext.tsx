import { fetchEventSource } from "@microsoft/fetch-event-source";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { mainApi } from "../axios/axiosInstance";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationItem {
  link: any;
  id: string;
  title: string;
  message: string;
  time: string;
  type: "urgent" | "info" | "success";
  read: boolean;
  category?: string;
  severity: string;
  createdAt?: string;
  referenceType: string;
  referenceId: string;
  actionable?: boolean;
  starred: boolean;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAllAsRead: () => Promise<void>;
  readNotification: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  deactivateDevice: () => Promise<void>;
  triggerPopup: (msg: string, severity?: string) => void;
  toast: { severity: string; visible: boolean; message: string };
  refreshNotifications: () => Promise<void>;
  fetchNotifications: (page?: number) => Promise<void>;
  isLoadingNotifs: boolean;
  isLastNotifPage: boolean;
  notifPage: number;
  toggleStar: (id: string, isStarred: boolean) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    severity: "INFO",
  });

  const [notifPage, setNotifPage] = useState(0);
  const [isLastNotifPage, setIsLastNotifPage] = useState(false);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "#FF3B30";
      case "SUCCESS":
        return "#4CD964";
      case "INFO":
        return "#007AFF";
      default:
        return "#333";
    }
  };
  const router = useRouter();

  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  const BASE_URL = "http://192.168.0.200:8081/api";

  const mapBackendToUI = (data: any): NotificationItem => ({
    id: data.id?.toString() || Math.random().toString(),
    title:
      data.title ||
      (data.type ? data.type.replace(/_/g, " ") : "System Update"),
    message: data.message || "New activity recorded",
    time: data.createdAt
      ? new Date(data.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Just now",
    type:
      data.priority === "HIGH"
        ? "urgent"
        : data.priority === "NORMAL"
          ? "info"
          : "success",
    read: !!data.read,
    severity: data.priority || "INFO",
    createdAt: data.createdAt,
    referenceType: data.referenceType,
    referenceId: data.referenceId,
    actionable: data.actionable ?? !!data.link,
    link: data.link,
    starred: !!data.starred, // Map the starred status from backend
  });

  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await AsyncStorage.getItem("token");
      if (storedToken) setToken(storedToken.replace(/"/g, ""));
    };
    loadToken();
  }, []);

  const fetchNotifications = async (page = 0) => {
    if (isLoadingNotifs || (isLastNotifPage && page !== 0)) return;

    try {
      setIsLoadingNotifs(true);
      const storedToken = await AsyncStorage.getItem("token");
      // const cleanToken = storedToken ? storedToken.replace(/"/g, "") : token;

      const [historyRes, countRes] = await Promise.all([
        mainApi.get(`${BASE_URL}/notifications`, {
          params: { page: page, size: 5 },
          headers: { Authorization: `Bearer ${storedToken}` },
        }),
        mainApi.get(`${BASE_URL}/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        }),
      ]);

      const { content, last } = historyRes.data;
      const newData = content.map(mapBackendToUI);

      if (page === 0) {
        setNotifications(newData);
      } else {
        setNotifications((prev) => [...prev, ...newData]);
      }

      setIsLastNotifPage(last);
      setNotifPage(page);
      setUnreadCount(Number(countRes.data));
    } catch (err) {
      console.error("Notification Fetch Error:", err);
    } finally {
      setIsLoadingNotifs(false);
    }
  };
  useEffect(() => {
    if (token) {
      fetchNotifications(0);
    }
  }, [token]);
  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;

    if (isCloseToBottom && !isLoadingNotifs && !isLastNotifPage) {
      fetchNotifications(notifPage + 1);
    }
  };
  const toggleStar = async (id: string, isStarred: boolean) => {
    try {
      await mainApi.patch(`${BASE_URL}/notifications/${id}/star`, null, {
        params: { starred: isStarred },
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, starred: isStarred } : n)),
      );

      triggerPopup("Notification star status updated", "SUCCESS");
    } catch (error) {
      console.error("Failed to toggle star", error);
      triggerPopup("Failed to update star status", "CRITICAL");
    }
  };
  const deleteAllNotifications = async () => {
    try {
      await mainApi.delete(`${BASE_URL}/notifications/delete-all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Clear local state
      setNotifications([]);
      setUnreadCount(0);

      triggerPopup("All notifications deleted successfully", "SUCCESS");
    } catch (error) {
      console.error("Failed to delete all notifications", error);
      triggerPopup("Failed to delete notifications", "CRITICAL");
    }
  };
  const registerDeviceWithBackend = async () => {
    try {
      if (Platform.OS === "web") {
        console.log("Push notifications are skipped on Web.");
        return;
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Failed to get push token for push notification!");
        return;
      }

      const fcmToken = (await Notifications.getDevicePushTokenAsync()).data;

      console.log("FCM Token:", fcmToken);

      await mainApi.post(
        `${BASE_URL}/notifications/register`,
        {
          deviceToken: fcmToken,
          deviceType: "ANDROID",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log("Device successfully registered with backend");
      setIsRegistered(true);

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
        });
      }
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };
  useEffect(() => {
    if (token && !isRegistered) {
      registerDeviceWithBackend();
    }
  }, [token]);
  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    fetchEventSource(`${BASE_URL}/notifications/subscribe`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
      },
      signal: controller.signal,
      openWhenHidden: true,
      onmessage(ev) {
        if (ev.event === "unread-count") {
          setUnreadCount(Number(ev.data));
          return;
        }

        if (ev.data) {
          try {
            const raw = JSON.parse(ev.data);
            const newNotif = mapBackendToUI(raw);

            setNotifications((prev) => {
              if (prev.some((n) => n.id === newNotif.id)) return prev;
              return [newNotif, ...prev];
            });
            playNotificationSound();
            triggerPopup(
              `${newNotif.title}: ${newNotif.message}`,
              newNotif.severity,
            );
          } catch (e) {
            console.error("SSE JSON Parse error", e);
          }
        }
      },
      onerror(err) {
        console.warn("SSE Connection lost, retrying...", err);
        return 3000;
      },
    });

    return () => controller.abort();
  }, [token]);
  const playNotificationSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/images/sounds/notification.mp3"),
      );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) sound.unloadAsync();
      });
    } catch (err) {
      console.error("Sound Play Error:", err);
    }
  };

  const triggerPopup = (msg: string, severity: string = "INFO") => {
    setToast({ visible: true, message: msg, severity });
    setTimeout(
      () => setToast({ visible: false, message: "", severity: "INFO" }),
      4000,
    );
  };

  const readNotification = async (id: string) => {
    const notification = notifications.find((n) => n.id === id);
    let shouldCallApi = false;
    if (!notification || notification.read) {
      // triggerPopup("clicked the notification");
      return;
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(prev - 1, 0));

    triggerPopup("notification marked as read");
    try {
      await mainApi.put(`${BASE_URL}/notifications/${id}/read`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.error("Failed to mark read", e);
    }
  };

  const markAllAsRead = async () => {
    await mainApi.put(`${BASE_URL}/notifications/read-all`, null, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (unreadCount === 0) {
      triggerPopup("no notifications found");
      return;
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    triggerPopup("All notifications and marked as read ");
  };

  const deleteNotification = async (id: string) => {
    await mainApi.delete(`${BASE_URL}/notifications/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };
  const deactivateDevice = async () => {
    try {
      const fcmTokenData = await Notifications.getDevicePushTokenAsync();
      const fcmToken = fcmTokenData?.data;

      if (fcmToken && token) {
        await mainApi.delete(`${BASE_URL}/devices/${fcmToken}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Device deactivated successfully");
      } else {
        console.warn("Deactivation skipped: Missing fcmToken or Auth token");
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Deactivation failed:", error.message);
      } else {
        console.error("An unexpected error occurred:", error);
      }
    }
  };
  const refreshNotifications = async () => {
    const storedToken = await AsyncStorage.getItem("token");
    if (storedToken) {
      const cleanToken = storedToken.replace(/"/g, "");
      setToken(cleanToken);
      setIsRegistered(false);
    }
  };
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        readNotification,
        markAllAsRead,
        deleteNotification,
        triggerPopup,
        toast,
        deactivateDevice,
        refreshNotifications,
        fetchNotifications,
        isLoadingNotifs,
        isLastNotifPage,
        deleteAllNotifications,
        toggleStar,
        notifPage,
      }}
    >
      {children}
      {toast.visible && (
        <View
          style={[
            styles.globalToast,
            { borderLeftColor: getSeverityColor(toast.severity) },
          ]}
        >
          <Text style={styles.toastTypeLabel}>{toast.severity}</Text>
          <Text style={styles.toastMessage}>{toast.message}</Text>
        </View>
      )}
    </NotificationContext.Provider>
  );
};
const styles = StyleSheet.create({
  globalToast: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 50 : 40,
    right: 20,
    backgroundColor: "#ffffff",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignContent: "center",
    borderLeftWidth: 6,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10000,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  toastTypeLabel: {
    fontSize: 12,
    fontWeight: "800",
    marginRight: 10,
    color: "#333",
  },
  toastMessage: {
    fontSize: 13,
    color: "#333",
    flex: 1,
  },
});
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context)
    throw new Error(
      "useNotifications must be used inside NotificationProvider",
    );
  return context;
};
