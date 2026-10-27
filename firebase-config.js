// Configuração do Firebase — cole aqui as credenciais do SEU projeto (Console Firebase > Configurações do projeto > Seus apps > Web).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCM9oOriM-ajie-UUkpkfnIw8JFfhpmA28",
  authDomain: "nuvem2-nicollas-anzzelotti.firebaseapp.com",
  projectId: "nuvem2-nicollas-anzzelotti",
  storageBucket: "nuvem2-nicollas-anzzelotti.firebasestorage.app",
  messagingSenderId: "777065842623",
  appId: "1:777065842623:web:d91f8468a272f7f8e3030a",
};

export const configured = !Object.values(firebaseConfig).some((v) => v.startsWith("COLE_"));

export let db = null;
export let ready = Promise.reject(new Error("firebase-not-configured"));
ready.catch(() => {});

if (configured) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  const auth = getAuth(app);
  // Identidade anônima e persistente: cada navegador tem seu mural privado.
  ready = auth.authStateReady().then(() => auth.currentUser || signInAnonymously(auth).then((c) => c.user));
}
