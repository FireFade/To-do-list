// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ===== Firebase Config =====
const firebaseConfig = {
  apiKey: "AIzaSyB7Id_8R-XtzrQ6tPkQ8FjjXi9sbPmboqI",
  authDomain: "to-do-list-cc091.firebaseapp.com",
  projectId: "to-do-list-cc091",
  storageBucket: "to-do-list-cc091.firebasestorage.app",
  messagingSenderId: "813168809993",
  appId: "1:813168809993:web:e945f037d4f854480780d8"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== DOM Elements =====
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const loginContainer = document.getElementById("login-container");
const registerContainer = document.getElementById("register-container");
const showRegister = document.getElementById("show-register");
const showLogin = document.getElementById("show-login");

const ADMIN_USERNAME = "admin4102";
const ADMIN_EMAIL = ADMIN_USERNAME + "@todo.com";
const ADMIN_PASSWORD = "admin4102";

// ===== Перемикання видимості форм =====
showRegister.addEventListener("click", (e) => {
  e.preventDefault();
  loginContainer.style.display = "none";
  registerContainer.style.display = "block";
});

showLogin.addEventListener("click", (e) => {
  e.preventDefault();
  registerContainer.style.display = "none";
  loginContainer.style.display = "block";
});

// ===== Seed адмін-акаунта (лише один раз) =====
if (!localStorage.getItem("adminSeeded")) {
  createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD)
    .then((cred) => {
      // Додаємо адміна в колекцію "users"
      return setDoc(doc(db, "users", cred.user.uid), {
        username: ADMIN_USERNAME
      });
    })
    .catch((err) => {
      // Якщо помилка “already-in-use” — ігноримо, інакше виводимо в консоль
      if (err.code !== "auth/email-already-in-use") {
        console.error(err);
      }
    })
    .finally(() => {
      localStorage.setItem("adminSeeded", "1");
    });
}

// ===== Обробник реєстрації =====
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("register-username").value.trim();
  const password = document.getElementById("register-password").value;

  if (!username || !password) return;

  try {
    const userCred = await createUserWithEmailAndPassword(
      auth,
      `${username}@todo.com`,
      password
    );
    // Додаємо нового юзера до колекції “users”
    await setDoc(doc(db, "users", userCred.user.uid), {
      username: username
    });
    // Перенаправляємо на index.html
    window.location.href = "index.html";
  } catch (err) {
    alert(`Помилка реєстрації: ${err.message}`);
  }
});

// ===== Обробник логіну =====
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;

  if (!username || !password) return;

  try {
    await signInWithEmailAndPassword(auth, `${username}@todo.com`, password);

    // Якщо увійшов адмін (admin4102@todo.com), кидаємо на admin.html
    if (auth.currentUser.email === ADMIN_EMAIL) {
      window.location.href = "admin.html";
    } else {
      // Інакше — на index.html
      window.location.href = "index.html";
    }
  } catch (err) {
    alert(`Помилка входу: ${err.message}`);
  }
});
