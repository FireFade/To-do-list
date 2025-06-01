// src/scripts/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB7Id_8R-XtzrQ6tPkQ8FjjXi9sbPmboqI",
  authDomain: "to-do-list-cc091.firebaseapp.com",
  projectId: "to-do-list-cc091",
  storageBucket: "to-do-list-cc091.firebasestorage.app",
  messagingSenderId: "813168809993",
  appId: "1:813168809993:web:e945f037d4f854480780d8",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
