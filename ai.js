// NUTSHELL AI layer.
// Talks DIRECTLY to the AI provider you choose, using YOUR OWN API key.
// No NUTSHELL / websim server sits in the middle any more: page content goes
// from this extension to the provider you picked and nowhere else.
"use strict";

(() => {
  /* ---------- providers ----------
     api: "openai" = OpenAI-compatible /chat/completions, "gemini" = Google generateContent.
     maxChars caps how much page text is sent (free tiers have small per-minute token limits).
     Model ids drift over time, so every model is editable in the settings panel. */
  const PROVIDERS = {
    groq: {
      label: "Groq (free, very fast)",
      api: "openai",
      base: "https://api.groq.com/openai/v1",
      model: "openai/gpt-oss-120b",
      maxChars: 14000,
      needsKey: true,
      keyHelp: "https://console.groq.com/keys",
    },
    gemini: {
      label: "Google AI Studio (Gemini)",
      api: "gemini",
      base: "https://generativelanguage.googleapis.com/v1beta",
      model: "gemini-2.5-flash",
      maxChars: 40000,
      needsKey: true,
      keyHelp: "https://aistudio.google.com/apikey",
    },
    openrouter: {
      label: "OpenRouter (free models)",
      api: "openai",
      base: "https://openrouter.ai/api/v1",
      model: "openrouter/free",
      maxChars: 20000,
      needsKey: true,
      keyHelp: "https://openrouter.ai/keys",
    },
    cerebras: {
      label: "Cerebras (free, small context)",
      api: "openai",
      base: "https://api.cerebras.ai/v1",
      model: "llama3.1-8b",
      maxChars: 9000,
      needsKey: true,
      keyHelp: "https://cloud.cerebras.ai",
    },
    mistral: {
      label: "Mistral (free Experiment tier)",
      api: "openai",
      base: "https://api.mistral.ai/v1",
      model: "mistral-small-latest",
      maxChars: 20000,
      needsKey: true,
      keyHelp: "https://console.mistral.ai/api-keys",
    },
    ollama: {
      label: "Ollama (runs on your PC, nothing leaves it)",
      api: "openai",
      base: "http://localhost:11434/v1",
      model: "llama3.1",
      maxChars: 12000,
      needsKey: false,
      editBase: true,
      keyHelp: "https://ollama.com",
    },
    custom: {
      label: "Custom (any OpenAI-compatible URL)",
      api: "openai",
      base: "",
      model: "",
      maxChars: 14000,
      needsKey: false,
      editBase: true,
      keyHelp: "",
    },
  };

  /* ---------- config (chrome.storage.local, never leaves this browser except to the provider) ---------- */
  async function loadConfig() {
    const { aiConfig } = await chrome.storage.local.get("aiConfig");
    const cfg = { primary: "groq", fallback: true, providers: {}, ...(aiConfig || {}) };
    if (!PROVIDERS[cfg.primary]) cfg.primary = "groq";
    cfg.providers = cfg.providers && typeof cfg.providers === "object" ? cfg.providers : {};
    return cfg;
  }

  async function saveConfig(cfg) {
    await chrome.storage.local.set({ aiConfig: cfg });
  }

  function resolved(cfg, id) {
    const p = PROVIDERS[id];
    const u = cfg.providers[id] || {};
    return {
      id,
      ...p,
      apiKey: String(u.apiKey || "").trim(),
      model: String(u.model || "").trim() || p.model,
      base: (String(u.base || "").trim() || p.base).replace(/\/+$/, ""),
    };
  }

  function isUsable(r) {
    if (!r.base || !r.model) return false;
    return r.needsKey ? !!r.apiKey : true;
  }

  // Primary provider first, then (optionally) every other provider that has a key,
  // so a rate-limited free tier falls over to the next one automatically.
  function buildChain(cfg) {
    const ids = [cfg.primary];
    if (cfg.fallback !== false) {
      for (const id of Object.keys(PROVIDERS)) {
        if (id === cfg.primary) continue;
        const r = resolved(cfg, id);
        if (r.needsKey && r.apiKey) ids.push(id);
      }
    }
    return ids.map((id) => resolved(cfg, id)).filter(isUsable);
  }

  /* ---------- prompt ---------- */
  const SYSTEM_PROMPT = `You are NUTSHELL, an assistant that reads the web page the user is viewing and answers the questions or tasks on it.

Reply with ONE JSON object and nothing else (no markdown fences, no commentary):
{"items":[ITEM, ...],"nextStep":"","comparedWith":""}

Each ITEM has these keys:
- "question": the question or task, trimmed
- "answer": the answer as readable plain text. For multiple choice start with the letter, e.g. "b) Paris"
- "kind": "option" (single-answer multiple choice), "multi-option", "text", "long-text", "number", or "date"
- "options": up to 4 option texts WITHOUT letters (multiple choice only)
- "correctOption": "a", "b", "c" or "d" (single-answer multiple choice only)
- "fill": the exact value to type or select into the page field. For multiple choice, the text of the chosen option
- "fieldId": the id in square brackets from ANSWERABLE FIELDS, when the item maps to one of those fields
- "label": a short field label
- "confidence": a number from 0 to 1. Be honest: use below 0.85 whenever you are unsure or the page does not contain what is needed
- "why": one or two sentences explaining the answer
- "needsPage": only when the answer needs content you were not given (for example an image you cannot see)

Rules:
- One ITEM per question or field. Never invent questions that are not on the page.
- Use the page text, the field list, and general knowledge. If the page lacks the information, say so and give low confidence instead of guessing wildly.
- For personal or sensitive fields (the user's own name, email, phone, address, passwords, ID numbers, payment details) do NOT make anything up: set "fill" to "" , confidence to 0, and say in "why" that the user must enter it.
- Plain text only inside strings: no markdown, no asterisks, no backticks.
- Keep every string value on a single line or use \\n for line breaks, so the JSON stays valid.`;

  function styleRule(style) {
    if (style === "short") return "ANSWER STYLE: very short. One short sentence or just the answer; keep \"why\" under 15 words.";
    if (style === "ultra") return "ANSWER STYLE: ultra detail. Full step-by-step reasoning in \"why\" and a thorough \"answer\".";
    return "ANSWER STYLE: detailed but efficient. A clear answer plus a brief \"why\".";
  }

  function hostOf(url) {
    try { return new URL(url).hostname; } catch { return ""; }
  }

  function fieldLines(fields) {
    return (Array.isArray(fields) ? fields : []).slice(0, 60).map((f) => {
      const isGroup = /group$/.test(f.kind || "");
      const opts = Array.isArray(f.options) && f.options.length ? ` | options: ${f.options.slice(0, 40).join(" / ")}` : "";
      const base = f.label || "";
      const q = isGroup || !base ? ` :: ${String(f.question || "").slice(0, 300)}` : "";
      return `[${f.id}] (${f.kind}${f.required ? ", required" : ""}) ${String(base).slice(0, 200)}${q}${opts}`;
    });
  }

  function mediaLines(media) {
    return (Array.isArray(media) ? media : []).slice(0, 36).map((m) =>
      `[${m.type}] ${m.alt || "untitled"}${m.captions ? `\nCaptions: ${String(m.captions).slice(0, 2000)}` : ""}`,
    );
  }

  function buildUserMessage(payload, maxChars) {
    const parts = [];
    const title = String(payload.title || "").slice(0, 200);
    const host = hostOf(payload.url);
    if (title || host) parts.push(`PAGE: ${title}${host ? ` (${host})` : ""}`);
    parts.push(styleRule(payload.answerStyle));
    if (payload.profile === "ultra") parts.push("MODE: ULTRA SCAN. Check every clue on the page and double-check each answer before replying.");
    if (payload.mode === "followup") {
      parts.push("MODE: FOLLOW-UP. Return exactly ONE item: \"question\" is the follow-up, \"answer\" is your reply in plain text.");
      if (Array.isArray(payload.priorItems) && payload.priorItems.length) {
        parts.push("EARLIER ANSWERS:\n" + payload.priorItems.map((i) => `Q: ${i.question}\nA: ${i.answer}`).join("\n\n"));
      }
      const convo = (payload.conversation || []).slice(0, -1);
      if (convo.length) parts.push("CHAT SO FAR:\n" + convo.map((t) => `${t.role === "user" ? "User" : "NUTSHELL"}: ${t.text}`).join("\n"));
    }
    parts.push(`TASK / PAGE TEXT:\n${String(payload.text || "").slice(0, maxChars)}`);
    const fl = fieldLines(payload.fields);
    if (fl.length) parts.push("ANSWERABLE FIELDS ON THIS PAGE:\n" + fl.join("\n"));
    const ml = mediaLines(payload.media);
    if (ml.length) parts.push("MEDIA INVENTORY:\n" + ml.join("\n"));
    return parts.join("\n\n");
  }

  /* ---------- HTTP helpers ---------- */
  async function post(url, headers, body, timeoutMs = 60000) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: ctl.signal, cache: "no-store" });
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch { /* non-JSON body */ }
      return { ok: res.ok, status: res.status, json, text };
    } catch (e) {
      if (e?.name === "AbortError") throw new Error("timed out");
      throw new Error("could not connect (network error or blocked)");
    } finally {
      clearTimeout(timer);
    }
  }

  function providerError(res) {
    const j = Array.isArray(res.json) ? res.json[0] : res.json;
    const detail = String(j?.error?.message || j?.message || res.text || "").replace(/\s+/g, " ").slice(0, 180);
    const s = res.status;
    let hint = "";
    if (s === 401 || s === 403) hint = "API key rejected";
    else if (s === 404) hint = "model or URL not found";
    else if (s === 413) hint = "request too large for this tier";
    else if (s === 429) hint = "rate limit reached";
    else if (s >= 500) hint = "provider error";
    return `${hint ? hint + " " : ""}(${s})${detail ? ": " + detail : ""}`;
  }

  // Error object for a failed HTTP reply. modelProblem = the model id is unknown / not allowed on this key.
  function providerErr(res) {
    const err = new Error(providerError(res));
    const j = Array.isArray(res.json) ? res.json[0] : res.json;
    const detail = String(j?.error?.message || j?.message || res.text || "");
    err.modelProblem = res.status === 404 || ([400, 403].includes(res.status) && /model/i.test(detail) && /(not exist|not found|no access|not supported|decommission|deprecat|invalid)/i.test(detail));
    return err;
  }

  async function callOpenAI(r, system, user, maxTokens, jsonMode = true) {
    const headers = { "content-type": "application/json" };
    if (r.apiKey) headers.authorization = `Bearer ${r.apiKey}`;
    const body = {
      model: r.model,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      temperature: 0.2,
      max_tokens: maxTokens,
    };
    if (jsonMode) body.response_format = { type: "json_object" };
    if (r.id === "groq" && /gpt-oss/i.test(r.model)) {
      body.reasoning_effort = "low";
      body.max_tokens = Math.max(maxTokens, 4096);
    }
    let res = await post(`${r.base}/chat/completions`, headers, body);
    // Some free models reject response_format; retry once without it.
    if (res.status === 400 && jsonMode) {
      delete body.response_format;
      delete body.reasoning_effort;
      res = await post(`${r.base}/chat/completions`, headers, body);
    }
    if (!res.ok) throw providerErr(res);
    const text = res.json?.choices?.[0]?.message?.content;
    if (!text) throw new Error("empty reply from model");
    return String(text);
  }

  async function callGemini(r, system, user, maxTokens) {
    const headers = { "content-type": "application/json", "x-goog-api-key": r.apiKey };
    const body = {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: Math.max(maxTokens, 4096),
        responseMimeType: "application/json",
      },
    };
    const res = await post(`${r.base}/models/${encodeURIComponent(r.model)}:generateContent`, headers, body);
    if (!res.ok) throw providerErr(res);
    const block = res.json?.promptFeedback?.blockReason;
    if (block) throw new Error(`blocked by provider safety filter (${block})`);
    const parts = res.json?.candidates?.[0]?.content?.parts || [];
    const text = parts.filter((p) => !p.thought).map((p) => p.text || "").join("");
    if (!text) throw new Error("empty reply from model");
    return text;
  }

  function callProvider(r, system, user, maxTokens) {
    return r.api === "gemini" ? callGemini(r, system, user, maxTokens) : callOpenAI(r, system, user, maxTokens);
  }

  /* ---------- model discovery (model ids change; ask the provider what YOUR key can use) ---------- */
  const NOT_CHAT = /embed|tts|whisper|guard|safeguard|image|audio|live|transcri|moderation|rerank|orpheus|playai|imagen|veo|aqa|robotics|computer-use|compound/i;
  const PREFER = {
    groq: ["gpt-oss-120b", "gpt-oss-20b", "llama-3.3-70b", "llama-4", "qwen", "kimi", "llama-3.1-8b"],
    gemini: ["gemini-3.5-flash", "gemini-2.5-flash", "flash", "pro"],
    cerebras: ["gpt-oss", "llama", "qwen"],
    mistral: ["mistral-small", "mistral-medium", "open-mistral", "mistral-large"],
    openrouter: ["openrouter/free", "llama", "qwen", "gemma", "mistral"],
  };

  async function getJSON(url, headers) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 20000);
    try {
      const res = await fetch(url, { method: "GET", headers, signal: ctl.signal, cache: "no-store" });
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch { /* non-JSON */ }
      return { ok: res.ok, status: res.status, json, text };
    } catch (e) {
      throw new Error(e?.name === "AbortError" ? "timed out" : "could not connect (network error or blocked)");
    } finally {
      clearTimeout(timer);
    }
  }

  async function listModelsFor(r) {
    if (r.needsKey && !r.apiKey) throw new Error("Paste your API key first.");
    if (!r.base) throw new Error("Enter the server URL first.");
    if (r.api === "gemini") {
      const res = await getJSON(`${r.base}/models?pageSize=200`, { "x-goog-api-key": r.apiKey });
      if (!res.ok) throw new Error(providerError(res));
      return (res.json?.models || [])
        .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
        .map((m) => String(m.name || "").replace(/^models\//, ""))
        .filter((id) => id && !NOT_CHAT.test(id));
    }
    const headers = {};
    if (r.apiKey) headers.authorization = `Bearer ${r.apiKey}`;
    const res = await getJSON(`${r.base}/models`, headers);
    if (!res.ok) throw new Error(providerError(res));
    let ids = (res.json?.data || res.json?.models || [])
      .map((m) => (typeof m === "string" ? m : m?.id || m?.name || ""))
      .filter((id) => id && !NOT_CHAT.test(id));
    // OpenRouter lists paid models too: never auto-switch to one of those.
    if (r.id === "openrouter") ids = ids.filter((id) => /:free$|^openrouter\/free$/.test(id));
    return ids;
  }

  function pickModel(r, ids) {
    for (const token of PREFER[r.id] || []) {
      const hit = ids.find((id) => id.toLowerCase().includes(token.toLowerCase()));
      if (hit) return hit;
    }
    return ids[0] || "";
  }

  // Run a call; if the model id is unknown / not allowed on this key, find one that is and retry once.
  async function callWithRecovery(r, system, user, maxTokens) {
    try {
      return { raw: await callProvider(r, system, user, maxTokens), model: r.model };
    } catch (e) {
      if (!e.modelProblem) throw e;
      let ids;
      try { ids = await listModelsFor(r); } catch { throw e; }
      const alt = pickModel(r, ids.filter((id) => id !== r.model));
      if (!alt) throw new Error(`${e.message} No other usable model was found for this key.`);
      const raw = await callProvider({ ...r, model: alt }, system, user, maxTokens);
      return { raw, model: alt, switchedFrom: r.model };
    }
  }

  /* ---------- parsing ---------- */
  function parseModelJSON(raw) {
    let t = String(raw || "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
    try { return JSON.parse(t); } catch { /* fall through */ }
    const a = t.indexOf("{");
    const b = t.lastIndexOf("}");
    if (a >= 0 && b > a) {
      try { return JSON.parse(t.slice(a, b + 1)); } catch { /* fall through */ }
    }
    return null;
  }

  const str = (v) => (v == null ? "" : String(v));

  function sanitizeItems(list, payload) {
    const ids = new Set();
    (payload.fields || []).forEach((f) => {
      ids.add(f.id);
      (f.members || []).forEach((m) => ids.add(m.id));
    });
    return (Array.isArray(list) ? list : [])
      .filter((x) => x && typeof x === "object")
      .map((x) => {
        const item = { ...x };
        ["question", "answer", "kind", "fill", "label", "why", "needsPage", "fieldId"].forEach((k) => { if (k in item) item[k] = str(item[k]); });
        if (item.fieldId && !ids.has(item.fieldId)) delete item.fieldId;
        if (Array.isArray(item.options)) item.options = item.options.map(str).filter(Boolean).slice(0, 4);
        else delete item.options;
        const c = Number(item.confidence);
        item.confidence = Number.isFinite(c) ? Math.max(0, Math.min(1, c)) : 0.6;
        if (item.correctOption) item.correctOption = str(item.correctOption).trim().toLowerCase().slice(0, 1);
        return item;
      })
      .filter((x) => x.answer || x.fill);
  }

  function toResult(raw, payload) {
    const obj = parseModelJSON(raw);
    if (!obj) {
      const plain = str(raw).replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      return { items: plain ? [{ question: "Result", answer: plain, confidence: 0.5 }] : [] };
    }
    const list = Array.isArray(obj) ? obj : Array.isArray(obj.items) ? obj.items : obj.answer ? [obj] : [];
    return {
      items: sanitizeItems(list, payload),
      nextStep: str(obj.nextStep),
      comparedWith: str(obj.comparedWith),
    };
  }

  /* ---------- public API ---------- */
  async function solve(payload) {
    const cfg = await loadConfig();
    const chain = buildChain(cfg);
    if (!chain.length) {
      throw new Error("Add an API key in ⚙ settings first. Groq and Google AI Studio both give free keys.");
    }
    const maxTokens = payload.profile === "ultra" || payload.answerStyle === "ultra" ? 3000 : 2048;
    const failures = [];
    for (const r of chain) {
      try {
        const user = buildUserMessage(payload, r.maxChars);
        const out = await callWithRecovery(r, SYSTEM_PROMPT, user, maxTokens);
        const result = toResult(out.raw, payload);
        if (out.switchedFrom) {
          cfg.providers[r.id] = { ...(cfg.providers[r.id] || {}), model: out.model };
          await saveConfig(cfg);
        }
        if (result.items.length) return { ...result, provider: r.id, model: out.model, switchedFrom: out.switchedFrom };
        failures.push(`${r.label.split(" (")[0]}: no usable answer in the reply`);
      } catch (e) {
        failures.push(`${r.label.split(" (")[0]}: ${e.message}`);
      }
    }
    throw new Error(failures.join(" | "));
  }

  // Uses the values currently typed in the settings form (not necessarily saved yet).
  async function testProvider(id, entry) {
    const base = PROVIDERS[id];
    const r = {
      id,
      ...base,
      apiKey: String(entry?.apiKey || "").trim(),
      model: String(entry?.model || "").trim() || base.model,
      base: (String(entry?.base || "").trim() || base.base).replace(/\/+$/, ""),
    };
    if (!r.base) throw new Error("Enter the server URL first.");
    if (!r.model) throw new Error("Enter a model name first.");
    if (r.needsKey && !r.apiKey) throw new Error("Paste your API key first.");
    const out = await callWithRecovery(r, 'Reply with exactly this JSON and nothing else: {"ok":true}', "ping", 256);
    return { model: out.model, switchedFrom: out.switchedFrom, reply: str(out.raw).slice(0, 60) };
  }

  // For the "List my models" button: what can this key actually use?
  async function listModels(id, entry) {
    const base = PROVIDERS[id];
    const r = {
      id,
      ...base,
      apiKey: String(entry?.apiKey || "").trim(),
      model: String(entry?.model || "").trim() || base.model,
      base: (String(entry?.base || "").trim() || base.base).replace(/\/+$/, ""),
    };
    const ids = await listModelsFor(r);
    return { ids, suggested: pickModel(r, ids), current: r.model };
  }

  function hasProvider(cfg) {
    return buildChain(cfg).length > 0;
  }

  window.NutshellAI = { PROVIDERS, loadConfig, saveConfig, resolved, buildChain, hasProvider, solve, testProvider, listModels };
})();
