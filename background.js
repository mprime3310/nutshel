// NUTSHELL Assistant background worker.
// Opens a persistent workspace next to the page being reviewed.

// Agent training finalization runs here via alarms, even while NUTSHELL is
// closed. It talks straight to the user's configured AI provider (ai.js
// config lives in chrome.storage.local) — no NUTSHELL server involved.
const TRAINING_ALARM_PREFIX = "nutshell-agent-training:";

const PROVIDER_DEFS = {
  groq: { api: "openai", base: "https://api.groq.com/openai/v1", model: "openai/gpt-oss-120b", needsKey: true },
  gemini: { api: "gemini", base: "https://generativelanguage.googleapis.com/v1beta", model: "gemini-2.5-flash", needsKey: true },
  openrouter: { api: "openai", base: "https://openrouter.ai/api/v1", model: "openrouter/free", needsKey: true },
  cerebras: { api: "openai", base: "https://api.cerebras.ai/v1", model: "llama3.1-8b", needsKey: true },
  mistral: { api: "openai", base: "https://api.mistral.ai/v1", model: "mistral-small-latest", needsKey: true },
  ollama: { api: "openai", base: "http://localhost:11434/v1", model: "llama3.1", needsKey: false },
  custom: { api: "openai", base: "", model: "", needsKey: false },
};

// Minimal text-completion helper for the service worker: primary provider
// first, then any other provider that has a saved key (same fallback idea as ai.js).
async function callAIProvider(system, user, maxTokens = 2048) {
  const { aiConfig } = await chrome.storage.local.get("aiConfig");
  const cfg = { primary: "groq", fallback: true, providers: {}, ...(aiConfig || {}) };
  const ids = [cfg.primary, ...(cfg.fallback !== false ? Object.keys(PROVIDER_DEFS) : [])]
    .filter((id, i, arr) => PROVIDER_DEFS[id] && arr.indexOf(id) === i);
  const failures = [];
  for (const id of ids) {
    const def = PROVIDER_DEFS[id];
    const saved = cfg.providers?.[id] || {};
    const apiKey = String(saved.apiKey || "").trim();
    const model = String(saved.model || "").trim() || def.model;
    const base = (String(saved.base || "").trim() || def.base).replace(/\/+$/, "");
    if (!base || !model) continue;
    if (def.needsKey && !apiKey) continue;
    try {
      if (def.api === "gemini") {
        const res = await fetch(`${base}/models/${encodeURIComponent(model)}:generateContent`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: "user", parts: [{ text: user }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: Math.max(maxTokens, 2048), responseMimeType: "application/json" },
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
        const text = (data?.candidates?.[0]?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || "").join("");
        if (text) return text;
        throw new Error("empty reply");
      }
      const headers = { "content-type": "application/json" };
      if (apiKey) headers.authorization = `Bearer ${apiKey}`;
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: system }, { role: "user", content: user }],
          temperature: 0.3,
          max_tokens: maxTokens,
          response_format: { type: "json_object" },
        }),
      });
      let body = await res.json().catch(() => null);
      if (res.status === 400) { // some models reject response_format
        delete body?.error;
        const retry = await fetch(`${base}/chat/completions`, {
          method: "POST",
          headers,
          body: JSON.stringify({ model, messages: [{ role: "system", content: system }, { role: "user", content: user }], temperature: 0.3, max_tokens: maxTokens }),
        });
        body = await retry.json().catch(() => null);
        if (!retry.ok) throw new Error(body?.error?.message || `HTTP ${retry.status}`);
      } else if (!res.ok) {
        throw new Error(body?.error?.message || `HTTP ${res.status}`);
      }
      const text = body?.choices?.[0]?.message?.content;
      if (text) return text;
      throw new Error("empty reply");
    } catch (e) {
      failures.push(`${id}: ${e?.message || e}`);
    }
  }
  throw new Error(failures.join(" | ") || "No AI provider configured — add an API key in ⚙ settings.");
}

const isWebsite = (tab) => /^https?:/i.test(tab?.url || "");
const tabSummary = (tab) => (isWebsite(tab) ? { id: tab.id, url: tab.url, title: tab.title, windowId: tab.windowId } : null);

async function rememberSource(tab) {
  const source = tabSummary(tab);
  if (source?.id) await chrome.storage.local.set({ sourceTabId: source.id });
  return source;
}

// This runs in the active website tab. The extension UI itself lives in an
// iframe so it keeps Chrome API access, while this lightweight shell gives it
// a draggable, resizable sidebar that never becomes a browser tab.
function openNutshellSidebar(panelUrl) {
  const panelId = "nutshell-floating-sidebar";
  const existing = document.getElementById(panelId);
  if (existing) {
    existing.style.display = "block";
    existing.style.zIndex = "2147483647";
    return { open: true, existing: true };
  }

  const host = document.createElement("div");
  host.id = panelId;
  Object.assign(host.style, {
    position: "fixed",
    top: "76px",
    right: "22px",
    width: "390px",
    height: "min(720px, calc(100vh - 100px))",
    minWidth: "320px",
    minHeight: "380px",
    maxWidth: "calc(100vw - 24px)",
    maxHeight: "calc(100vh - 24px)",
    zIndex: "2147483647",
    resize: "both",
    overflow: "hidden",
    borderRadius: "16px",
    border: "1px solid rgba(184,140,255,.55)",
    boxShadow: "0 0 0 1px rgba(255,47,185,.28), 0 0 38px rgba(150,100,255,.38), 0 22px 70px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.12)",
    // Dark, mostly opaque glass so the panel stays visible on white pages.
    background: "rgba(11,7,18,.9)",
    backdropFilter: "blur(18px) saturate(140%)",
    webkitBackdropFilter: "blur(18px) saturate(140%)",
    // Keep iframe + embedder colour schemes equal so the iframe stays see-through.
    colorScheme: "normal",
  });

  const shadow = host.attachShadow({ mode: "open" });
  const grip = document.createElement("div");
  grip.textContent = "✦  NUTSHELL  ·  drag to move";
  Object.assign(grip.style, {
    height: "30px",
    display: "flex",
    alignItems: "center",
    padding: "0 10px",
    color: "#f4eeff",
    background: "linear-gradient(110deg, rgba(110,64,210,.9), rgba(255,47,185,.78), rgba(50,160,190,.85))",
    borderBottom: "1px solid rgba(184,140,255,.45)",
    font: "700 11px/1 system-ui, sans-serif",
    letterSpacing: ".5px",
    cursor: "grab",
    userSelect: "none",
    touchAction: "none",
  });
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "×";
  close.title = "Close NUTSHELL";
  Object.assign(close.style, {
    marginLeft: "4px",
    border: "0",
    borderRadius: "6px",
    width: "22px",
    height: "22px",
    color: "#0d0716",
    background: "rgba(255,255,255,.45)",
    cursor: "pointer",
    font: "700 20px/18px system-ui, sans-serif",
  });
  close.addEventListener("click", () => host.remove());
  const min = document.createElement("button");
  min.type = "button";
  min.textContent = "–";
  min.title = "Minimize NUTSHELL";
  Object.assign(min.style, {
    marginLeft: "auto",
    border: "0",
    borderRadius: "6px",
    width: "22px",
    height: "22px",
    color: "#0d0716",
    background: "rgba(255,255,255,.45)",
    cursor: "pointer",
    font: "700 18px/20px system-ui, sans-serif",
  });
  let minimized = false;
  let prevBox = null;
  min.addEventListener("click", () => {
    minimized = !minimized;
    if (minimized) {
      prevBox = { width: host.style.width, height: host.style.height, minHeight: host.style.minHeight };
      frame.style.display = "none";
      host.style.width = "240px";
      host.style.height = "30px";
      host.style.minHeight = "30px";
      host.style.maxHeight = "30px";
      min.textContent = "▣";
      min.title = "Restore NUTSHELL";
    } else {
      frame.style.display = "block";
      host.style.width = prevBox?.width || "";
      host.style.height = prevBox?.height || "";
      host.style.minHeight = prevBox?.minHeight || "380px";
      host.style.maxHeight = "";
      min.textContent = "–";
      min.title = "Minimize NUTSHELL";
    }
  });
  grip.appendChild(min);
  grip.appendChild(close);

  const frame = document.createElement("iframe");
  frame.src = panelUrl;
  frame.title = "NUTSHELL Assistant";
  frame.setAttribute("allow", "microphone; clipboard-read; clipboard-write");
  Object.assign(frame.style, {
    display: "block",
    width: "100%",
    height: "calc(100% - 30px)",
    border: "0",
    background: "transparent",
    colorScheme: "normal",
  });

  let pointer = null;
  grip.addEventListener("pointerdown", (event) => {
    if (event.target === close || event.target === min) return;
    const rect = host.getBoundingClientRect();
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
    grip.setPointerCapture(event.pointerId);
    grip.style.cursor = "grabbing";
  });
  grip.addEventListener("pointermove", (event) => {
    if (!pointer || event.pointerId !== pointer.id) return;
    const nextLeft = Math.max(0, Math.min(window.innerWidth - host.offsetWidth, pointer.left + event.clientX - pointer.x));
    const nextTop = Math.max(0, Math.min(window.innerHeight - host.offsetHeight, pointer.top + event.clientY - pointer.y));
    host.style.left = `${nextLeft}px`;
    host.style.top = `${nextTop}px`;
    host.style.right = "auto";
    host.style.bottom = "auto";
  });
  const stopDrag = (event) => {
    if (!pointer || event.pointerId !== pointer.id) return;
    pointer = null;
    grip.style.cursor = "grab";
  };
  grip.addEventListener("pointerup", stopDrag);
  grip.addEventListener("pointercancel", stopDrag);

  shadow.append(grip, frame);
  document.documentElement.appendChild(host);
  return { open: true, existing: false };
}

async function openForTab(tab) {
  const source = await rememberSource(tab);
  if (!source) return openCompactWindow();
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: source.id },
      args: [chrome.runtime.getURL("popup.html")],
      func: openNutshellSidebar,
    });
    if (results?.[0]?.result?.open) return { mode: "sidebar" };
  } catch {
    // Chrome blocks script injection on browser-internal pages and a few
    // protected sites. Fall back to the same compact workspace in its own
    // movable browser window rather than opening a full page.
  }
  return openCompactWindow();
}

async function openCompactWindow() {
  const url = chrome.runtime.getURL("popup.html");
  const windows = await chrome.windows.getAll({ populate: true });
  const existing = windows.find((win) => win.tabs?.some((tab) => tab.url === url));
  if (existing?.id) {
    await chrome.windows.update(existing.id, { focused: true });
    return { mode: "compact-window", existing: true };
  }
  await chrome.windows.create({ url, type: "popup", width: 420, height: 760, focused: true });
  return { mode: "compact-window", existing: false };
}

async function scheduleTrainingAlarm(agent) {
  if (!agent?.id || agent.trainingStatus !== "training") return;
  const when = Math.max(Date.now() + 1000, Number(agent.readyAt) || 0);
  await chrome.alarms.create(`${TRAINING_ALARM_PREFIX}${agent.id}`, { when });
}

async function restoreTrainingAlarms() {
  const { nutshellAgents = [] } = await chrome.storage.local.get("nutshellAgents");
  for (const agent of nutshellAgents) {
    if (agent?.trainingStatus === "training") await scheduleTrainingAlarm(agent);
  }
}

// Four-hour training timer fires here. Final evaluation runs against the
// user's own AI provider (no server) and writes the playbook back to storage.
async function completeAgentTraining(agentId) {
  const { nutshellAgents = [] } = await chrome.storage.local.get("nutshellAgents");
  const agent = nutshellAgents.find((item) => item?.id === agentId);
  if (!agent || agent.trainingStatus !== "training") return;
  const expectedReadyAt = Number(agent.readyAt) || 0;
  if (expectedReadyAt > Date.now()) {
    await scheduleTrainingAlarm(agent);
    return;
  }

  try {
    const system = `You are NUTSHELL Training, an AI coach evaluator. You receive an agent's name, focus, and its previous playbook plus assessment history. Reply with ONE JSON object and nothing else:
{"playbook":"updated task playbook, max 8000 chars","strengths":["..."],"weaknesses":["..."],"improvements":["..."],"evaluationSummary":"one paragraph","modifications":["what changed this run"]}
Judge the playbook against the focus: does it produce correct, well-structured help for the topic? Strengthen weak guidance, keep what works. Plain text in strings, no markdown.`;
    const user = `AGENT: ${agent.name}\nFOCUS: ${agent.focus}\nTRAINING RUN: ${Math.max(1, Math.min(4, Number(agent.trainingRuns) || 1))} of 4\n\nPREVIOUS PLAYBOOK:\n${(agent.trainingProfile?.playbook || "(first run — create the playbook)").slice(0, 8000)}\n\nPREVIOUS ASSESSMENT:\n${[
      ...(agent.trainingProfile?.strengths || []).map((value) => `Strength: ${value}`),
      ...(agent.trainingProfile?.weaknesses || []).map((value) => `Weakness: ${value}`),
      ...(agent.trainingProfile?.improvements || []).map((value) => `Improvement: ${value}`),
      ...(agent.trainingProfile?.modifications || []).map((value) => `Previous modification: ${value}`),
      agent.trainingProfile?.evaluationSummary || "",
    ].join("\n").slice(0, 3000)}`;
    const raw = await callAIProvider(system, user, 3000);
    const cleaned = String(raw).replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
    let profile = null;
    try { profile = JSON.parse(cleaned); } catch {
      const a = cleaned.indexOf("{"); const b = cleaned.lastIndexOf("}");
      if (a >= 0 && b > a) { try { profile = JSON.parse(cleaned.slice(a, b + 1)); } catch { /* fall through */ } }
    }
    if (!profile?.playbook) throw new Error("Final playbook evaluation returned no playbook.");

    const latest = await chrome.storage.local.get("nutshellAgents");
    const current = Array.isArray(latest.nutshellAgents) ? latest.nutshellAgents : [];
    const target = current.find((item) => item?.id === agentId);
    if (!target || target.trainingStatus !== "training" || Number(target.readyAt) !== expectedReadyAt) return;
    const run = Math.max(1, Math.min(4, Number(target.trainingRuns) || 1));
    const modifications = Array.isArray(profile.modifications) ? profile.modifications.slice(0, 6).map((value) => String(value).slice(0, 500)) : [];
    const evaluationSummary = String(profile.evaluationSummary || "").slice(0, 1600);
    const reports = [...(target.trainingProfile?.reports || []).filter((report) => Number(report.run) !== run), { run, at: Date.now(), modifications, evaluationSummary }].slice(-4);
    const completed = {
      ...target,
      trainingStatus: "ready",
      trainingError: "",
      readyAt: 0,
      trainedAt: Date.now(),
      trainingProfile: {
        playbook: String(profile.playbook).slice(0, 8000),
        strengths: Array.isArray(profile.strengths) ? profile.strengths.slice(0, 5) : [],
        weaknesses: Array.isArray(profile.weaknesses) ? profile.weaknesses.slice(0, 5) : [],
        improvements: Array.isArray(profile.improvements) ? profile.improvements.slice(0, 6) : [],
        evaluationTasks: Array.isArray(profile.evaluationTasks) ? profile.evaluationTasks.slice(0, 5) : [],
        evaluationSummary,
        modifications,
        reports,
      },
    };
    await chrome.storage.local.set({
      nutshellAgents: current.map((item) => item?.id === agentId ? completed : item),
    });
  } catch (error) {
    console.warn("NUTSHELL agent training finalization failed; retrying.", error);
    const latest = await chrome.storage.local.get("nutshellAgents");
    const current = Array.isArray(latest.nutshellAgents) ? latest.nutshellAgents : [];
    const target = current.find((item) => item?.id === agentId);
    if (target?.trainingStatus === "training" && Number(target.readyAt) === expectedReadyAt) {
      await chrome.storage.local.set({
        nutshellAgents: current.map((item) => item?.id === agentId
          ? { ...item, trainingError: String(error?.message || "Evaluation is retrying.").slice(0, 300) }
          : item),
      });
    }
    await chrome.alarms.create(`${TRAINING_ALARM_PREFIX}${agentId}`, { when: Date.now() + 5 * 60 * 1000 });
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (!alarm?.name?.startsWith(TRAINING_ALARM_PREFIX)) return;
  void completeAgentTraining(alarm.name.slice(TRAINING_ALARM_PREFIX.length));
});

chrome.runtime.onStartup.addListener(() => {
  void restoreTrainingAlarms();
});

chrome.runtime.onInstalled.addListener(() => {
  void restoreTrainingAlarms();
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "nutshell-solve",
      title: "Solve selection with NUTSHELL",
      contexts: ["selection"],
    });
  });
});

// Keep the source pointed at the website the user is currently viewing. The
// side panel itself is not a tab, so it is never accidentally scanned.
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  await rememberSource(tab);
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.url) void rememberSource(tab);
});

// Open a compact, draggable sidebar in the current website. No extension tab
// is created, and toolbar clicks only reveal an existing sidebar.
chrome.action.onClicked.addListener(async (tab) => {
  await openForTab(tab).catch(() => undefined);
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "nutshell-solve" && info.selectionText) {
    const source = await rememberSource(tab);
    await chrome.storage.local.set({ pendingText: info.selectionText, sourceTabId: source?.id || null });
    await openForTab(tab).catch(() => undefined);
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, respond) => {
  if (msg?.type === "get-source-tab") {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(async (tabs) => {
      const activeWebsite = tabs.find(isWebsite);
      if (activeWebsite) {
        const source = await rememberSource(activeWebsite);
        respond({ tab: source });
        return;
      }
      const { sourceTabId } = await chrome.storage.local.get(["sourceTabId"]);
      const source = tabSummary(sourceTabId ? await chrome.tabs.get(sourceTabId).catch(() => null) : null);
      respond({ tab: source });
    });
    return true;
  }
  if (msg?.type === "set-source-tab") {
    chrome.storage.local.set({ sourceTabId: msg.tabId }).then(() => respond({ ok: true }));
    return true;
  }
  return false;
});
