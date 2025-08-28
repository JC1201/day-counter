import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDxdLoPrfSwz_nF6javwGtFomxcC3sbo3s",
  authDomain: "day-counter-8b702.firebaseapp.com",
  projectId: "day-counter-8b702",
  storageBucket: "day-counter-8b702.firebasestorage.app",
  messagingSenderId: "553691624006",
  appId: "1:553691624006:web:62e0b611ad8810f096d047",
  measurementId: "G-NG9RF3DBPF"
};

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
