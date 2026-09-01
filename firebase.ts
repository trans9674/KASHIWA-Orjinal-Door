import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_KASHIWA_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_KASHIWA_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_KASHIWA_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_KASHIWA_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_KASHIWA_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_KASHIWA_FIREBASE_APP_ID || ""
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);

// 接続先のプロジェクトIDとストレージバケットを確認用に出力
console.log("=== Firebase Connection Info ===");
console.log("Project ID:", firebaseConfig.projectId);
console.log("Storage Bucket:", firebaseConfig.storageBucket);
console.log("================================");
