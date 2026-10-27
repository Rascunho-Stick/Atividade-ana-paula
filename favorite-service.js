// CRUD da coleção favoriteAdvice no Firestore. Sem acesso ao DOM.
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query, where, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db, ready } from "./firebase-config.js";

const COL = "favoriteAdvice";

export async function addFavorite({ adviceId, adviceText, note = "" }) {
  const user = await ready;
  return addDoc(collection(db, COL), {
    uid: user.uid, adviceId: adviceId ?? null, adviceText, note, source: "advice-slip",
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
}

// Atualiza o documento existente; só envia os campos informados.
export function updateFavorite(id, changes) {
  return updateDoc(doc(db, COL, id), { ...changes, updatedAt: serverTimestamp() });
}

export const removeFavorite = (id) => deleteDoc(doc(db, COL, id));

// Um único listener em tempo real; retorna a função para cancelá-lo.
export async function subscribeFavorites(onData, onError) {
  const user = await ready;
  const q = query(collection(db, COL), where("uid", "==", user.uid));
  return onSnapshot(q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) }))),
    onError);
}
