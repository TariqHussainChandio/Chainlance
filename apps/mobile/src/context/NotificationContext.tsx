/**
 * FCM push notification context.
 *
 * Production wiring requires @react-native-firebase/messaging (native module).
 * This stub provides the hook interface so the rest of the app can call
 * useFcm() without crashing; swap the stub body with real code once the
 * native module is linked and the google-services.json / GoogleService-Info.plist
 * files are added to the Android / iOS projects.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "./AuthContext";

interface NotificationState {
  fcmToken: string | null;
  hasPermission: boolean;
}

const NotificationContext = createContext<NotificationState>({
  fcmToken: null,
  hasPermission: false,
});

export function useFcm(): NotificationState {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<NotificationState>({
    fcmToken: null,
    hasPermission: false,
  });

  useEffect(() => {
    if (!user) return;

    // ── Stub implementation ─────────────────────────────────────────────────
    // Real implementation would be:
    //
    //   import messaging from "@react-native-firebase/messaging";
    //
    //   async function register() {
    //     const authStatus = await messaging().requestPermission();
    //     const enabled =
    //       authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    //       authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    //     if (!enabled) return;
    //     const token = await messaging().getToken();
    //     setState({ fcmToken: token, hasPermission: true });
    //     await updateDoc(doc(db, "users", user.uid), { fcmToken: token });
    //   }
    //   register();
    //
    //   return messaging().onTokenRefresh(async (token) => {
    //     setState((s) => ({ ...s, fcmToken: token }));
    //     await updateDoc(doc(db, "users", user.uid), { fcmToken: token });
    //   });
    // ────────────────────────────────────────────────────────────────────────

    // Stub: mark permission as unavailable until native module is linked.
    setState({ fcmToken: null, hasPermission: false });
  }, [user]);

  return (
    <NotificationContext.Provider value={state}>
      {children}
    </NotificationContext.Provider>
  );
}
