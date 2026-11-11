/**
 * Mobile environment configuration.
 *
 * Firebase client config is public by design (it ships in every client
 * bundle); security comes from Firestore rules + server-side auth.
 *
 * API_BASE_URL points at the ChainWork web app, which hosts the /api/v1
 * REST surface the mobile app uses for privileged operations.
 * - Android emulator: http://10.0.2.2:3000 reaches the host machine's dev server
 * - Physical device: use your machine's LAN IP, e.g. http://192.168.x.x:3000
 * - Production: the deployed web origin
 */
import { Platform } from "react-native";

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBpTbmShBtjlHvChN8_dODIS22a-Ll12cw",
  authDomain: "freelancechain-5f872.firebaseapp.com",
  projectId: "freelancechain-5f872",
  storageBucket: "freelancechain-5f872.firebasestorage.app",
  messagingSenderId: "922208596354",
  appId: "1:922208596354:web:54b484e933520d05a11f9b",
};

const DEV_API_BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

export const API_BASE_URL = __DEV__
  ? DEV_API_BASE_URL
  : "https://chainwork.example.com"; // TODO: set the deployed web origin before release
