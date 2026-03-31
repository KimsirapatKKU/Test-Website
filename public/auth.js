import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-analytics.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";



// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBKgde-m4X41jSNls4_iENfd10kBvi5k7w",
  authDomain: "food-ordering-e4739.firebaseapp.com",
  projectId: "food-ordering-e4739",
  storageBucket: "food-ordering-e4739.firebasestorage.app",
  messagingSenderId: "393255355775",
  appId: "1:393255355775:web:d3f935052f69e72bb3464a",
  measurementId: "G-3KQHR4W82X"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);   
const db = getFirestore(app);                                                                                                      
/* ================= HELPERS ================= */
async function hash(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function showError(elId, msg) {
  const el = document.getElementById(elId);
  if (el) { el.textContent = msg; el.classList.remove("d-none"); }
}

/* ================= CORE FUNCTIONS ================= */

async function loadUserProfile() {
    const user = localStorage.getItem("loginUser");
    const role = localStorage.getItem("role");

    if (role === "admin" && !window.location.href.includes("chef.html")) {
        window.location.href = "chef.html";
        return;
    }

    if (!user) return;

    try {
        const snap = await getDoc(doc(db, "Account", user));
        if (snap.exists()) {
            const data = snap.data();
            if(document.getElementById("loginBtn")) document.getElementById("loginBtn").style.display = "none";
            if(document.getElementById("userProfile")) document.getElementById("userProfile").style.display = "flex";
            if(document.getElementById("userNameDisplay")) document.getElementById("userNameDisplay").textContent = user;

            const iconContainer = document.getElementById("userIconContainer");
            if (iconContainer && data.profileImg) {
                iconContainer.innerHTML = `<img src="${data.profileImg}" class="user-icon-img" style="width:38px;height:38px;border-radius:50%;object-fit:cover;border:2px solid white;">`;
            }
        }
    } catch (e) { console.error(e); }
}

document.addEventListener("DOMContentLoaded", loadUserProfile);

/* ================= EVENT LISTENERS ================= */

document.addEventListener("click", (e) => {
  if (e.target.id === "toRegister") {
    document.getElementById("loginBox").classList.add("d-none");
    document.getElementById("registerBox").classList.remove("d-none");
  }
  if (e.target.id === "toLogin") {
    document.getElementById("registerBox").classList.add("d-none");
    document.getElementById("loginBox").classList.remove("d-none");
  }
});

document.addEventListener("submit", async (e) => {
  e.preventDefault();

  /* ----- LOGIN ----- */
  if (e.target.id === "loginForm") {
    const userVal = document.getElementById("loginUser").value.trim();
    const passVal = document.getElementById("loginPass").value; 
    
    try {
      const snap = await getDoc(doc(db, "Account", userVal));
      
      if (!snap.exists() || (await hash(passVal)) !== snap.data().passwordHash) {
        showError("loginError", "❌ ข้อมูลไม่ถูกต้อง"); 
        return;
      }

      const role = snap.data().role || "user";
      localStorage.setItem("loginUser", userVal);
      localStorage.setItem("role", role);
      
      if (role === "admin") {
          window.location.href = "chef.html";
      } else {
          // รีโหลดหน้าปัจจุบันเพื่อรักษาค่า ?table=... ใน URL ไว้เหมือนเดิม
          window.location.reload();
      }
    } catch (err) {
      showError("loginError", "❌ เกิดข้อผิดพลาดในการเชื่อมต่อ"); 
    }
  }

  /* ----- REGISTER ----- */
if (e.target.id === "registerForm") {
  const user = document.getElementById("regUser").value.trim();
  const pass = document.getElementById("regPass").value;

  if (!user) {
    showError("registerError", "❌ กรุณากรอกชื่อผู้ใช้");
    return;
  }

  if (pass !== document.getElementById("regPassConfirm").value) {
    showError("registerError", "❌ รหัสผ่านไม่ตรงกัน");
    return;
  }

  const userRef = doc(db, "Account", user);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    showError("registerError", "❌ ชื่อนี้มีผู้ใช้แล้ว");
    return;
  }

  await setDoc(userRef, {
    passwordHash: await hash(pass),
    role: "user",
    profileImg: ""
  });

  alert("สมัครสำเร็จ!");
  window.location.reload();
}

  /* ----- EDIT PROFILE ----- */
  if (e.target.id === "editProfileForm") {
    const user = document.getElementById("editUser").value;
    const avatarPreview = document.getElementById("avatarPreview").src;
    if (avatarPreview.startsWith("data:image")) {
        await updateDoc(doc(db, "Account", user), { profileImg: avatarPreview });
        window.location.reload();
    }
  }
});