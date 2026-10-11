/* ================================================================
   PORTED FEATURES FROM NUTSHELL 4.6 (folder 46).
   Memory/profiles, document upload, media sampling (GIF/video),
   comparison, identity verify, reset attempt, AI agents w/ training,
   data export/import, tutorial, boot sequence, mode switching.
   Billing/activation and the accent-color picker are excluded.
   AI calls go through our real providers via NutshellAI.ask.
   ================================================================ */

const P = { $: (id) => document.getElementById(id) };
const ask = (...a) => window.NutshellAI.ask(...a);

/* ================================================================
   MEMORY / PROFILES  (up to 10)
   ================================================================ */
const MEMORY_FIELDS = [
  { key: "fullName", label: "Full name", placeholder: "Full name" },
  { key: "firstName", label: "First name", placeholder: "First name" },
  { key: "lastName", label: "Last name", placeholder: "Last name" },
  { key: "name", label: "Preferred name", placeholder: "Preferred name" },
  { key: "email", label: "Email", placeholder: "you@example.com" },
  { key: "phone", label: "Phone", placeholder: "+1 555 0100" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/…" },
  { key: "scholar", label: "Google Scholar", placeholder: "https://scholar.google.com/…" },
  { key: "website", label: "Website / portfolio", placeholder: "https://…" },
  { key: "location", label: "Location", placeholder: "City, country" },
  { key: "jobTitle", label: "Job title", placeholder: "Current role" },
  { key: "company", label: "Company", placeholder: "Current organization" },
  { key: "education", label: "Education", placeholder: "Degrees, institutions, dates", multi: true },
  { key: "skills", label: "Skills", placeholder: "Core skills and tools", multi: true },
  { key: "experience", label: "Experience", placeholder: "Roles, achievements, projects", multi: true },
  { key: "bio", label: "Bio", placeholder: "About you, your background and goals…", multi: true },
];
let editingProfileIndex = -1;
let addingProfile = false;
let profileCountForDraft = -1;

async function loadMemories() {
  const stored = await chrome.storage.local.get("nutshellProfiles");
  return Array.isArray(stored.nutshellProfiles) ? stored.nutshellProfiles.slice(0, 10) : [];
}
async function saveMemories(list) {
  await chrome.storage.local.set({ nutshellProfiles: (list || []).slice(0, 10) });
}
function noteMemories(message) {
  const note = P.$("profiles-note");
  if (note) note.textContent = message || "";
}
function readMemorySlot(wrap) {
  const out = {};
  MEMORY_FIELDS.forEach((f) => {
    const el = wrap.querySelector(`[data-mfield="${f.key}"]`);
    out[f.key] = String(el?.value || "").trim();
  });
  return out;
}
function profileDisplayName(profile) {
  return profile.fullName || [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.name || "New profile";
}
function buildMemorySlot(index, profile) {
  const wrap = document.createElement("article");
  wrap.className = "memory-slot";
  const expanded = addingProfile ? index === profileCountForDraft : index === editingProfileIndex;
  const summary = document.createElement("button");
  summary.className = "profile-name";
  summary.type = "button";
  summary.textContent = profileDisplayName(profile);
  summary.setAttribute("aria-expanded", String(expanded));
  summary.addEventListener("click", () => {
    editingProfileIndex = expanded ? -1 : index;
    addingProfile = false;
    renderMemories();
  });
  wrap.appendChild(summary);
  if (!expanded) return wrap;
  const editor = document.createElement("div");
  editor.className = "profile-editor";
  MEMORY_FIELDS.forEach((field) => {
    const control = field.multi ? document.createElement("textarea") : document.createElement("input");
    control.className = field.multi ? "memory-input memory-textarea" : "memory-input";
    control.placeholder = field.placeholder;
    control.dataset.mfield = field.key;
    control.value = profile[field.key] || "";
    control.setAttribute("aria-label", field.label);
    editor.appendChild(control);
  });
  const injects = document.createElement("div");
  injects.className = "memory-injects";
  const useAll = document.createElement("button");
  useAll.className = "fill";
  useAll.type = "button";
  useAll.textContent = "⇪ Fill matching fields";
  useAll.addEventListener("click", async () => {
    const list = await loadMemories();
    await injectAllMemoryValues(list[index] || {});
  });
  injects.appendChild(useAll);
  editor.appendChild(injects);
  const actions = document.createElement("div");
  actions.className = "profile-actions";
  const save = document.createElement("button");
  save.className = "fill";
  save.type = "button";
  save.textContent = "Save profile";
  save.addEventListener("click", async () => {
    const data = readMemorySlot(editor);
    if (profileDisplayName(data) === "New profile") { noteMemories("Add at least a name before saving."); return; }
    const list = await loadMemories();
    if (addingProfile) {
      if (list.length >= 10) { noteMemories("You can save up to 10 profiles."); return; }
      list.push(data);
      addingProfile = false;
    } else { list[index] = data; }
    editingProfileIndex = -1;
    await saveMemories(list);
    await refreshPersonalData();
    noteMemories("Profile saved.");
    renderMemories();
  });
  actions.appendChild(save);
  if (!addingProfile) {
    const remove = document.createElement("button");
    remove.className = "ghost profile-delete";
    remove.type = "button";
    remove.textContent = "Delete";
    remove.addEventListener("click", async () => {
      const list = await loadMemories();
      list.splice(index, 1);
      await saveMemories(list);
      editingProfileIndex = -1;
      await refreshPersonalData();
      noteMemories("Profile deleted.");
      renderMemories();
    });
    actions.appendChild(remove);
  }
  editor.appendChild(actions);
  wrap.appendChild(editor);
  return wrap;
}
async function renderMemories() {
  const slotEl = P.$("profiles-slots");
  if (!slotEl) return;
  slotEl.innerHTML = "";
  const profiles = await loadMemories();
  profileCountForDraft = profiles.length;
  profiles.forEach((profile, index) => slotEl.appendChild(buildMemorySlot(index, profile)));
  if (addingProfile) slotEl.appendChild(buildMemorySlot(profiles.length, {}));
  const add = P.$("profile-add");
  if (add) {
    add.disabled = profiles.length >= 10 || addingProfile;
    add.textContent = profiles.length >= 10 ? "10 profiles saved" : "＋ Add profile";
  }
}
async function injectAllMemoryValues(profile) {
  const candidates = MEMORY_FIELDS
    .map(({ key, label }) => ({ question: label, answer: String(profile[key] || "").trim(), fill: String(profile[key] || "").trim(), confidence: 1, kind: "long text" }))
    .filter((entry) => entry.fill);
  if (!candidates.length) return showError("This profile has no saved details to inject.");
  showStatus("Matching all saved profile details to page fields for your review…");
  await runDryRun(candidates);
}
async function refreshPersonalData() {
  const stored = await chrome.storage.local.get(["nutshellMemoryEnabled", "nutshellMemoryNotes"]);
  const profiles = await loadMemories();
  const p = Array.isArray(profiles) && profiles[0];
  const profileText = p
    ? MEMORY_FIELDS.map((field) => (p[field.key] ? field.label + ": " + p[field.key] : "")).filter(Boolean).join("\n")
    : "";
  window.__nutshellPersonalData = stored.nutshellMemoryEnabled
    ? [profileText, String(stored.nutshellMemoryNotes || "").trim()].filter(Boolean).join("\n\n")
    : profileText;
}
function personalData() {
  return window.__nutshellPersonalData || "";
}


/* ================================================================
   DOCUMENT UPLOAD  (PDF/DOC/DOCX/RTF/ODT/TXT/CSV/JSON)
   ================================================================ */
function portedDecodeXmlEntities(value) {
  const area = document.createElement("textarea");
  area.innerHTML = value;
  return area.value;
}
function portedCleanText(value) {
  return String(value || "")
    .replace(/\u0000/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|#160);/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 36000);
}
function portedStripRtf(value) {
  return String(value || "")
    .replace(/\\'[0-9a-f]{2}/gi, " ")
    .replace(/\\par[d]?/gi, "\n")
    .replace(/\\[a-z]+\d* ?/gi, "")
    .replace(/[{}]/g, "");
}
function portedExtractPdf(buffer) {
  const raw = new TextDecoder("latin1").decode(buffer);
  const strings = [];
  const pattern = /\((?:\\\.|[^\\()])*\)/g;
  for (const match of raw.matchAll(pattern)) {
    const value = match[0].slice(1, -1)
      .replace(/\\([()\\])/g, "$1")
      .replace(/\\n/g, " ")
      .replace(/\\r/g, " ");
    if (/[A-Za-z]{2,}/.test(value)) strings.push(value);
  }
  return portedCleanText(strings.join(" "));
}
function portedLegacyBinary(buffer) {
  const raw = new TextDecoder("latin1").decode(buffer);
  const readable = raw.match(/[\x20-\x7E\r\n]{4,}/g) || [];
  return portedCleanText(readable.filter((chunk) => /[A-Za-z]{2,}/.test(chunk)).join(" "));
}
async function portedUnzipDocx(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const decoder = new TextDecoder("utf-8");
  let offset = 0;
  while (offset + 30 <= bytes.length) {
    if (view.getUint32(offset, true) !== 0x04034b50) { offset += 1; continue; }
    const method = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const name = decoder.decode(bytes.slice(offset + 30, offset + 30 + nameLength)).replace(/\\/g, "/");
    const start = offset + 30 + nameLength + extraLength;
    if (name === "word/document.xml") {
      const compressed = bytes.slice(start, start + compressedSize);
      let xml;
      if (method === 0) xml = decoder.decode(compressed);
      else if (method === 8 && window.DecompressionStream) {
        const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
        xml = decoder.decode(await new Response(stream).arrayBuffer());
      }
      if (xml) return portedCleanText(portedDecodeXmlEntities(xml));
    }
    if (!compressedSize) break;
    offset = start + compressedSize;
  }
  return "";
}
async function portedExtractDocument(file) {
  const name = file.name || "uploaded document";
  const lower = name.toLowerCase();
  const ext = lower.includes(".") ? lower.split(".").pop() : "";
  if (ext === "docx") {
    const text = await portedUnzipDocx(await file.arrayBuffer());
    return text || `DOCX file: ${name}. The text could not be extracted in this browser.`;
  }
  if (ext === "pdf" || file.type === "application/pdf") {
    const text = portedExtractPdf(await file.arrayBuffer());
    return text || `PDF file: ${name}. This PDF appears to be scanned or uses compressed text; use the filename and ask about it after upload.`;
  }
  const raw = await file.text();
  if (ext === "rtf" || file.type === "application/rtf") return portedCleanText(portedStripRtf(raw));
  if (ext === "doc") {
    const text = portedLegacyBinary(await file.arrayBuffer());
    return text || portedCleanText(raw);
  }
  return portedCleanText(raw);
}


/* ================================================================
   MEDIA SAMPLING  (image → dataURL, animated GIF → frames, video → frames)
   ================================================================ */
function portedMediaFrameDataUrl(source) {
  const canvas = document.createElement("canvas");
  const width = source.videoWidth || source.naturalWidth || 0;
  const height = source.videoHeight || source.naturalHeight || 0;
  const scale = Math.min(1, 1400 / Math.max(width, height, 1));
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}
async function portedSampleAnimatedImage(file) {
  if (typeof ImageDecoder !== "function") return [];
  let decoder;
  try {
    decoder = new ImageDecoder({ data: await file.arrayBuffer(), type: file.type });
    await decoder.tracks.ready;
    const count = Number(decoder.tracks.selectedTrack?.frameCount) || 1;
    if (count < 2) return [];
    const indices = [...new Set([0, Math.round((count - 1) / 3), Math.round((count - 1) * 2 / 3), count - 1])];
    const frames = [];
    for (const frameIndex of indices) {
      const result = await decoder.decode({ frameIndex });
      const image = result.image;
      frames.push({
        src: portedMediaFrameDataUrl(image),
        time: Number(image.timestamp) > 0 ? Number(image.timestamp) / 1000000 : frameIndex,
      });
      image.close?.();
    }
    return frames;
  } catch {
    return [];
  } finally {
    decoder?.close?.();
  }
}
async function portedSamplePageAnimatedImage(source) {
  try {
    const response = await fetch(source, { credentials: "include" });
    if (!response.ok) return [];
    const blob = await response.blob();
    if (!String(blob.type || "").startsWith("image/") || blob.size > 40 * 1024 * 1024) return [];
    const file = new File([blob], "page-animation", { type: blob.type });
    return await portedSampleAnimatedImage(file);
  } catch {
    return [];
  }
}
async function portedSampleVideoUpload(file) {
  if (file.size > 150 * 1024 * 1024) throw new Error("Videos must be 150 MB or smaller.");
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.src = objectUrl;
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Video metadata took too long to load.")), 12000);
      video.addEventListener("loadedmetadata", () => { clearTimeout(timer); resolve(); }, { once: true });
      video.addEventListener("error", () => { clearTimeout(timer); reject(new Error("This video format could not be opened.")); }, { once: true });
    });
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const fractions = duration > 0.3 ? [0.08, 0.36, 0.68, 0.92] : [0];
    const frames = [];
    for (const fraction of fractions) {
      const time = duration ? Math.max(0, Math.min(duration - 0.05, duration * fraction)) : 0;
      if (Math.abs(video.currentTime - time) > 0.02) {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error("A video frame could not be read.")), 8000);
          video.addEventListener("seeked", () => { clearTimeout(timer); resolve(); }, { once: true });
          video.currentTime = time;
        });
      } else if (video.readyState < 2) {
        await new Promise((resolve) => video.addEventListener("loadeddata", resolve, { once: true }));
      }
      frames.push({ src: portedMediaFrameDataUrl(video), time });
    }
    return { frames, duration: Math.round(duration) };
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}
async function portedPrepareUploadedMedia(file) {
  if (!file || !/^(image|video)\//i.test(file.type || "")) {
    throw new Error("Choose an image, animated GIF, or video file.");
  }
  let frames = [];
  let duration = null;
  let kind = "image";
  if (/^video\//i.test(file.type)) {
    kind = "video";
    const sampled = await portedSampleVideoUpload(file);
    frames = sampled.frames;
    duration = sampled.duration;
  } else if (/gif|webp|apng/i.test(file.type)) {
    const animated = await portedSampleAnimatedImage(file);
    if (animated.length) { frames = animated; kind = "animated image"; }
  }
  if (!frames.length) {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("That image could not be read."));
      reader.readAsDataURL(file);
    });
    frames = [{ src: dataUrl, time: 0 }];
  }
  return { name: file.name, type: file.type, kind, duration, frames };
}
function portedBuildFramesContext(frames) {
  if (!frames?.length) return "";
  return frames.map((frame, index) => `[frame ${index + 1}${frame.time != null ? ` @ ~${Math.round(frame.time)}s` : ""}]`).join(" ");
}


/* ================================================================
   INJECTED PAGE FUNCTIONS  (run inside the target tab via executeScript)
   Must be fully self-contained — no closure over module scope.
   ================================================================ */

/* reset attempt: find the page's own official retry/reset control */
function pageScanResetControls() {
  const allElements = () => {
    const found = [];
    const visit = (root) => {
      for (const element of root.querySelectorAll("*")) {
        found.push(element);
        if (element.shadowRoot) visit(element.shadowRoot);
      }
    };
    visit(document);
    return found;
  };
  const elements = allElements();
  elements.forEach((el) => el.removeAttribute("data-nutshell-reset-control"));
  const visible = (el) => {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  };
  const candidates = elements.filter((el) => el.matches("button,a,[role='button'],input[type='button'],input[type='submit']"))
    .filter(visible)
    .map((el) => {
      const label = String(el.innerText || el.value || el.getAttribute("aria-label") || el.title || "").replace(/\s+/g, " ").trim().slice(0, 180);
      let ancestor = el;
      let context = "";
      for (let depth = 0; ancestor && depth < 7 && context.length < 700; depth++) {
        context += ` ${ancestor.innerText || ancestor.textContent || ""}`;
        ancestor = ancestor.parentElement || ancestor.getRootNode?.().host || null;
      }
      context = context.replace(/\s+/g, " ").slice(0, 700);
      const searchableLabel = `${label} ${el.getAttribute("aria-label") || ""} ${el.title || ""}`.toLowerCase();
      const action = /\b(reset|restart|retake|try again|start over|new attempt)\b/i.test(searchableLabel);
      const explicitlyAssessment = /\b(assessment|quiz|test|exam|attempt|questionnaire)\b/i.test(searchableLabel);
      const retryAction = /\b(try again|start over|new attempt|retake)\b/i.test(searchableLabel);
      const assessmentContext = /\b(assessment|quiz|test|exam|attempt|questionnaire)\b/i.test(context);
      const destructive = /\b(delete|remove|erase|clear|reset)\b.{0,30}\b(grade|score|result|record|history|data)\b/i.test(`${searchableLabel} ${context}`);
      return { el, label, action, explicitlyAssessment, assessmentContext, retryAction, destructive };
    })
    .filter((item) => item.label && item.action && (item.explicitlyAssessment || (item.assessmentContext && (item.retryAction || /\b(reset|restart)\b/i.test(item.label)))) && !item.destructive)
    .slice(0, 12);
  candidates.forEach(({ el }, index) => el.setAttribute("data-nutshell-reset-control", String(index)));
  return {
    title: document.title,
    href: location.href,
    candidates: candidates.map(({ label, el }, index) => ({
      index, label, tag: el.tagName.toLowerCase(), href: el.tagName === "A" ? el.href : "",
    })),
  };
}
function pageActivateResetControl(index) {
  const findControls = (root) => {
    const found = [];
    for (const node of root.querySelectorAll("*")) {
      if (node.hasAttribute("data-nutshell-reset-control")) found.push(node);
      if (node.shadowRoot) found.push(...findControls(node.shadowRoot));
    }
    return found;
  };
  const element = findControls(document).find((node) => node.getAttribute("data-nutshell-reset-control") === String(index));
  if (!element) return { ok: false, message: "That page control is no longer available. Scan the page again." };
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return { ok: false, message: "That reset option is no longer visible. Scan the page again." };
  element.click();
  return Promise.resolve({ ok: true });
}


/* identity verify: find upload fields + what the page asks for */
function pageScanIdentity() {
  const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
  const visibleEnough = (el) => {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && (rect.width > 0 || el.type === "file");
  };
  const labelFor = (el) => clean([
    el.labels?.[0]?.innerText,
    el.closest("label")?.innerText,
    el.getAttribute("aria-label"),
    el.getAttribute("aria-labelledby") ? document.getElementById(el.getAttribute("aria-labelledby"))?.innerText : "",
    el.placeholder,
    el.name,
    el.id,
  ].filter(Boolean).join(" · ")).slice(0, 220);
  const fileInputs = [...document.querySelectorAll("input[type=file]")].filter((el) => el.type === "file" || visibleEnough(el)).map((el, index) => {
    const label = labelFor(el) || `Upload ${index + 1}`;
    const id = `identity-upload-${index + 1}`;
    el.setAttribute("data-nutshell-identity-upload", id);
    return { id, label, accept: el.accept || "" };
  });
  const textFields = [...document.querySelectorAll("input,textarea,[contenteditable='true'],[role='textbox']")]
    .filter((el) => {
      if (!visibleEnough(el) || el.disabled || el.readOnly) return false;
      const type = String(el.type || "").toLowerCase();
      return !["hidden", "file", "button", "submit", "reset", "checkbox", "radio"].includes(type);
    })
    .map((el) => labelFor(el))
    .filter(Boolean);
  const bodyText = clean(document.body?.innerText || "").slice(0, 12000);
  const haystack = `${bodyText} ${fileInputs.map((item) => item.label).join(" ")} ${textFields.join(" ")}`;
  const needs = [];
  if (/\b(back|reverse)\b.{0,50}\b(id|license|passport|document|upload|photo)\b|\b(id|license|passport|document)\b.{0,50}\b(back|reverse)\b/i.test(haystack)) needs.push("back");
  if (/\b(selfie|face|live photo|liveness|facial|portrait)\b/i.test(haystack)) needs.push("selfie");
  if (/\b(front|identity document|government id|driver.?s license|passport|national id)\b/i.test(haystack) || fileInputs.length) needs.push("front");
  return {
    fileInputs,
    textFields: textFields.slice(0, 12),
    needs: [...new Set(needs)],
    verifyMentioned: /\bverify|verification|identity check|confirm identity\b/i.test(haystack),
    title: clean(document.title || location.hostname || "Verification page"),
  };
}
async function pageLoadIdentityFile(payload) {
  const clean = (value) => String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  const fileInputs = [...document.querySelectorAll("input[type=file]")];
  if (!fileInputs.length) return { ok: false, message: "No upload control was found on this page." };
  const slot = clean(payload.slot);
  const score = (el) => {
    const text = clean([
      el.labels?.[0]?.innerText,
      el.closest("label")?.innerText,
      el.getAttribute("aria-label"),
      el.placeholder, el.name, el.id, el.accept,
      el.closest("section,fieldset,form,div")?.innerText?.slice(0, 260),
    ].filter(Boolean).join(" "));
    let value = 0;
    if (slot === "back" && /back|reverse/.test(text)) value += 90;
    if (slot === "selfie" && /selfie|face|liveness|live photo|portrait/.test(text)) value += 90;
    if (slot === "front" && /front|identity|document|passport|license|id card/.test(text)) value += 60;
    if (slot === "selfie" && /image|photo/.test(el.accept || "")) value += 12;
    if (slot !== "selfie" && /pdf|document|image/.test(el.accept || "")) value += 10;
    if (el.files?.length) value -= 25;
    return value;
  };
  const ranked = fileInputs.map((el, index) => ({ el, index, score: score(el) })).sort((a, b) => b.score - a.score);
  const target = ranked.find((candidate) => !candidate.el.files?.length) || ranked[0];
  if (!target) return { ok: false, message: "No unused upload control was found." };
  try {
    const match = String(payload.dataUrl || "").match(/^data:([^;,]+)?(;base64)?,([\s\S]*)$/i);
    if (!match) return { ok: false, message: "That file could not be prepared for upload." };
    const mime = payload.type || match[1] || "application/octet-stream";
    const raw = match[2] ? atob(match[3]) : decodeURIComponent(match[3]);
    const bytes = Uint8Array.from(raw, (character) => character.charCodeAt(0));
    const blob = new Blob([bytes], { type: mime });
    const file = new File([blob], payload.name || `${slot}.upload`, { type: payload.type || blob.type || "application/octet-stream" });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    target.el.files = transfer.files;
    target.el.dispatchEvent(new Event("input", { bubbles: true }));
    target.el.dispatchEvent(new Event("change", { bubbles: true }));
    target.el.closest("label")?.scrollIntoView?.({ block: "center" });
    return { ok: true, message: `Loaded ${file.name} into ${target.el.labels?.[0]?.innerText || "the matching upload field"}.` };
  } catch (error) {
    return { ok: false, message: error?.message || "The site rejected this file load." };
  }
}


/* type "verify" into a matching verification field (self-contained) */
function pageTypeVerify(options = {}) {
  window.__nutshellStopTyping = false;
  const clean = (value) => String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  const labelFor = (el) => clean([
    el.labels?.[0]?.innerText,
    el.closest("label")?.innerText,
    el.getAttribute("aria-label"),
    el.placeholder, el.name, el.id,
    el.closest("section,fieldset,form,div")?.innerText?.slice(0, 260),
  ].filter(Boolean).join(" "));
  const fields = [...document.querySelectorAll("input,textarea,[contenteditable='true'],[role='textbox']")]
    .filter((el) => {
      if (el.disabled || el.readOnly) return false;
      const type = String(el.type || "").toLowerCase();
      if (["hidden", "file", "button", "submit", "reset", "checkbox", "radio"].includes(type)) return false;
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden" && (rect.width > 0 || el.isContentEditable);
    });
  const target = fields.map((el) => {
    const label = labelFor(el);
    let score = 0;
    if (/type.{0,20}verify|enter.{0,20}verify|verification phrase|confirm.{0,20}identity/.test(label)) score = 100;
    else if (/verify|verification|identity check|confirmation/.test(label)) score = 60;
    else if (/code|phrase|text/.test(label)) score = 18;
    return { el, score };
  }).sort((a, b) => b.score - a.score)[0];
  if (!target || target.score < 40) return { ok: false, message: "No field asking you to type a verification phrase was found." };
  const value = "verify";
  const delay = Math.max(1, Math.min(1500, Number(options.speed) || 90));
  const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const setValue = (val) => {
    if (target.el.isContentEditable) target.el.textContent = val;
    else {
      const proto = target.el.tagName === "TEXTAREA" ? HTMLTextAreaElement : HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(proto.prototype, "value")?.set;
      if (setter) setter.call(target.el, val); else target.el.value = val;
    }
  };
  return (async () => {
    target.el.focus?.({ preventScroll: true });
    setValue("");
    for (const character of value) {
      if (window.__nutshellStopTyping) return { ok: false, stopped: true, message: "Typing stopped." };
      target.el.dispatchEvent(new KeyboardEvent("keydown", { key: character, bubbles: true }));
      setValue(`${target.el.isContentEditable ? target.el.textContent : target.el.value || ""}${character}`);
      target.el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: character }));
      target.el.dispatchEvent(new KeyboardEvent("keyup", { key: character, bubbles: true }));
      await pause(delay);
    }
    target.el.dispatchEvent(new Event("change", { bubbles: true }));
    return { ok: true, message: "Typed “verify” into the verification field." };
  })();
}
function pageStopTyping() {
  window.__nutshellStopTyping = true;
  return true;
}

