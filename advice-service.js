// Comunicação com a Advice Slip API. Preserva o texto original (em inglês).
const URL_API = "https://api.adviceslip.com/advice";

export async function fetchAdvice() {
  // O parâmetro t evita o cache de 2 s da API, que repetiria o mesmo conselho.
  const res = await fetch(`${URL_API}?t=${Date.now()}`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error("http-" + res.status);
  const slip = (await res.json())?.slip;
  if (!slip || typeof slip.advice !== "string" || !slip.advice.trim()) throw new Error("invalid-response");
  return { id: slip.id ?? null, text: slip.advice.trim() };
}
