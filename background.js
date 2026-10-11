// NUTSHELL Assistant background worker.
// Opens a persistent workspace next to the page being reviewed.

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

chrome.runtime.onInstalled.addListener(() => {
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
