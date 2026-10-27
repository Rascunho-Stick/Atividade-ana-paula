import { fetchAdvice } from "./advice-service.js";
import { addFavorite, updateFavorite, removeFavorite, subscribeFavorites } from "./favorite-service.js";
import { configured } from "./firebase-config.js";
import { toast } from "./notifications.js";

const $ = (s) => document.querySelector(s);
const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const ICONS = {
  bulb: svg('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>'),
  book: svg('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M8 7h7"/>'),
  bookmark: svg('<path d="M6 3h12v18l-6-4-6 4z"/>'),
  refresh: svg('<path d="M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5"/>'),
  copy: svg('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>'),
  share: svg('<path d="M12 15V3M8 7l4-4 4 4M5 12v7h14v-7"/>'),
  edit: svg('<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>'),
  trash: svg('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  eye: svg('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
};
document.querySelectorAll("[data-icon]").forEach((el) => el.insertAdjacentHTML("afterbegin", ICONS[el.dataset.icon]));

const state = { advice: null, saved: false, loading: false, saving: false, favs: [], loaded: false, q: "", sort: "recent", target: null };

/* ---------- Conselho atual ---------- */
function setBusy(b) {
  state.loading = b;
  $("#spinner").hidden = !b;
  $("#advice-card").setAttribute("aria-busy", b);
  $("#btn-new").disabled = b;
  syncSave();
}
function syncSave() {
  const btn = $("#btn-save");
  btn.disabled = !state.advice || state.loading || state.saving || state.saved;
  btn.lastChild.textContent = state.saved ? "Salvo nos favoritos" : "Salvar nos favoritos";
  $("#btn-copy").disabled = !state.advice;
}
async function loadAdvice() {
  if (state.loading) return; // evita requisições simultâneas
  setBusy(true);
  $("#advice-error").hidden = true;
  try {
    state.advice = await fetchAdvice();
    state.saved = false;
    const t = $("#advice-text");
    t.textContent = state.advice.text;
    t.classList.remove("in"); void t.offsetWidth; t.classList.add("in");
    $("#advice-id").textContent = state.advice.id != null ? `Conselho nº ${state.advice.id}` : "Conselho do momento";
  } catch (e) {
    $("#advice-error").hidden = false;
    if (!state.advice) $("#advice-text").textContent = "";
    toast("A API de conselhos não respondeu. Clique em “Novo conselho” para tentar de novo.", "error");
  } finally { setBusy(false); }
}
async function saveCurrent() {
  if (!state.advice?.text || state.saved || state.saving) return;
  if (!configured) return toast("Configure o Firebase para salvar favoritos.", "error");
  state.saving = true; syncSave();
  try {
    await addFavorite({ adviceId: state.advice.id, adviceText: state.advice.text, note: $("#note").value.trim() });
    state.saved = true; $("#note").value = "";
    toast("Conselho salvo nos favoritos.", "ok");
  } catch (e) { toast(fbError(e, "salvar"), "error"); }
  finally { state.saving = false; syncSave(); }
}
function fbError(e, verb) {
  if (e?.code === "permission-denied") return `Sem permissão para ${verb}. Confira as regras do Firestore.`;
  if (e?.code === "unavailable") return `Sem conexão com o banco. Não foi possível ${verb}.`;
  return `Não foi possível ${verb}. Tente novamente.`;
}

/* ---------- Copiar e compartilhar ---------- */
async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast("Texto copiado.", "ok"); }
  catch { toast("Não foi possível copiar. Selecione o texto e copie manualmente.", "error"); }
}
async function share(text) { try { await navigator.share({ title: "Reflexa", text }); } catch {} }
if (navigator.share) $("#btn-share").hidden = false;

/* ---------- Mural ---------- */
const fmt = (f) => f.createdAt?.toDate().toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" }) ?? "";
const ms = (f) => f.createdAt?.toMillis() ?? 0;

function visible() {
  const q = state.q.trim().toLowerCase();
  const l = state.favs.filter((f) => !q || f.adviceText.toLowerCase().includes(q) || (f.note || "").toLowerCase().includes(q));
  const by = { recent: (a, b) => ms(b) - ms(a), old: (a, b) => ms(a) - ms(b), az: (a, b) => a.adviceText.localeCompare(b.adviceText, "en") };
  return l.sort(by[state.sort]);
}
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
function iconBtn(icon, label, fn, cls = "btn-ghost") {
  const b = el("button", `btn btn-sm ${cls}`); b.type = "button"; b.innerHTML = ICONS[icon] + label; b.onclick = fn; return b;
}
function render() {
  $("#count").textContent = state.favs.length;
  $("#btn-clear").hidden = !state.q;
  const list = $("#list"); list.replaceChildren();
  if (!configured) return;
  if (!state.loaded) return list.append(el("p", "empty", "Carregando favoritos…"));
  const items = visible();
  if (!state.favs.length) return list.append(el("p", "empty", "Seu mural está vazio. Salve um conselho que faça sentido para você."));
  if (!items.length) return list.append(el("p", "empty", `Nenhum favorito encontrado para “${state.q}”.`));
  for (const f of items) {
    const card = el("article", "fav");
    card.append(el("p", "fav-text", f.adviceText));
    if (f.note) card.append(el("p", "fav-note", f.note));
    card.append(el("p", "fav-meta", `Salvo em ${fmt(f)}${f.adviceId != null ? ` · Conselho nº ${f.adviceId}` : ""}`));
    const a = el("div", "actions");
    a.append(iconBtn("eye", "Ver", () => openView(f)), iconBtn("edit", "Editar", () => openEdit(f)),
      iconBtn("copy", "Copiar", () => copy(f.adviceText)), iconBtn("trash", "Excluir", () => openDel(f)));
    card.append(a); list.append(card);
  }
}
function startWall() {
  if (!configured) { $("#config-warning").hidden = false; return render(); }
  render();
  subscribeFavorites(
    (data) => { state.favs = data; state.loaded = true; render(); },
    (e) => { state.loaded = true; render(); toast(fbError(e, "carregar os favoritos"), "error"); }
  ).then((unsub) => addEventListener("pagehide", unsub))
   .catch((e) => { state.loaded = true; render(); toast(fbError(e, "carregar os favoritos"), "error"); });
}

/* ---------- Modais ---------- */
document.querySelectorAll("dialog [data-close]").forEach((b) => (b.onclick = () => b.closest("dialog").close()));
function openView(f) {
  const body = $("#view-body"); body.replaceChildren(el("p", "fav-text", f.adviceText));
  if (f.note) body.append(el("p", "fav-note", f.note));
  body.append(el("p", "fav-meta", `Salvo em ${fmt(f)}. Editado em ${f.updatedAt?.toDate().toLocaleString("pt-BR") ?? "—"}. Origem: ${f.source}.`));
  $("#dlg-view").showModal();
}
function openEdit(f) {
  state.target = f; $("#e-text").value = f.adviceText; $("#e-note").value = f.note || "";
  $("#e-error").hidden = true; $("#dlg-edit").showModal();
}
$("#form-edit").onsubmit = async (ev) => {
  ev.preventDefault();
  const text = $("#e-text").value.trim(), note = $("#e-note").value.trim(), f = state.target;
  const err = $("#e-error");
  if (!text) { err.textContent = "O texto do conselho não pode ficar vazio."; err.hidden = false; return; }
  const changes = { note };
  if (text !== f.adviceText) changes.adviceText = text; // preserva o original se não houve mudança
  const btn = $("#e-save"); btn.disabled = true;
  try { await updateFavorite(f.id, changes); $("#dlg-edit").close(); toast("Favorito atualizado.", "ok"); }
  catch (e) { err.textContent = fbError(e, "salvar as alterações"); err.hidden = false; }
  finally { btn.disabled = false; }
};
function openDel(f) {
  state.target = f;
  const s = f.adviceText.length > 90 ? f.adviceText.slice(0, 90) + "…" : f.adviceText;
  $("#del-text").textContent = `Deseja realmente remover “${s}” dos seus favoritos?`;
  $("#dlg-del").showModal();
}
$("#del-ok").onclick = async () => {
  const b = $("#del-ok"); b.disabled = true;
  try { await removeFavorite(state.target.id); toast("Favorito excluído.", "ok"); }
  catch (e) { toast(fbError(e, "excluir"), "error"); } // a lista só muda quando o banco confirma
  finally { b.disabled = false; $("#dlg-del").close(); }
};

/* ---------- Eventos ---------- */
$("#btn-new").onclick = loadAdvice;
$("#btn-save").onclick = saveCurrent;
$("#btn-copy").onclick = () => state.advice && copy(state.advice.text);
$("#btn-share").onclick = () => state.advice && share(state.advice.text);
$("#q").oninput = (e) => { state.q = e.target.value; render(); };
$("#btn-clear").onclick = () => { state.q = ""; $("#q").value = ""; render(); $("#q").focus(); };
$("#sort").onchange = (e) => { state.sort = e.target.value; render(); };

syncSave(); loadAdvice(); startWall();
