// js/config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAsr-JbArcAu-7_csBxM6VDsC7hyPz7qB0",
  authDomain: "meter-form.firebaseapp.com",
  projectId: "meter-form",
  storageBucket: "meter-form.firebasestorage.app",
  messagingSenderId: "338954736636",
  appId: "1:338954736636:web:06817290680190530d17d0",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);