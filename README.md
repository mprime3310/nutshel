# NUTSHELL Assistant

Browser extension that lets NUTSHELL read the page beside it, answer
questions, autofill fields, and run follow-up Q&A.

## v3.3.0: bring your own AI key (no middleman server)

The extension no longer talks to any NUTSHELL / websim server. Open the gear
icon, pick a provider, paste your own API key, and page content goes straight
from your browser to that provider.

Supported: Groq, Google AI Studio (Gemini), OpenRouter free models, Cerebras,
Mistral, Ollama (fully local), or any OpenAI-compatible URL. Save keys for
several providers and tick the fallback box: if one hits its free rate limit,
the next one is tried automatically. Model names are editable because free
model ids change often. If a model is not available on your key, NUTSHELL asks the
provider what your key can use, switches to a working one and saves it. The
"List models my key can use" button shows that list. Keys live in `chrome.storage.local` only.

Autofill types into fields key by key (keydown, input, keyup events) at a steady
speed you choose: a Typing speed slider (10 to 600 WPM) with Slow / Medium /
Fast / Turbo presets, or "Instant fill". The preview shows an estimated time,
and "Stop typing" cancels mid-field. Dates, selects, radios and
checkboxes are set directly because they can't be typed.

The ⚙ button opens the provider settings as a popup. The look is dark cyber
phonk (faded magenta / violet / cyan) on near-opaque glass, so it stays readable
on white pages.

Ollama note: start it with `OLLAMA_ORIGINS=chrome-extension://*` so the
extension is allowed to call it. Use is **unlimited** — no trial limit, no
license token. The header shows UNLIMITED.

## Files

- `manifest.json`, `background.js` — MV3 manifest and sidebar launcher.
- `popup.html`, `popup.css`, `popup.js` — the sidebar UI, page scan, autofill.
- `ai.js` — provider layer (prompt, Groq/Gemini/OpenAI-compatible calls, fallback).

## Install the extension

Unzip this folder, open `chrome://extensions`, enable **Developer
mode**, choose **Load unpacked**, and pick that folder (it contains
`manifest.json`). Open any website, click the toolbar icon to open the
sidebar.

## License tokens

License gate removed: `popup.js` authorises every scan and follow-up, so no
token UI appears. The old token list is inert.

## Manual auto-type deck (dynamic paste + assign + organise)

- **Manual auto-type deck** (under Answers): paste any text, name the slot, hit
  **Add slot**. Slots persist in `chrome.storage.local`.
- Each slot is numbered (`01`, `02`…), shows char count, and keeps its own
  target field: **Type**, **Assign**, **Flash**, **Up**, **Down**, **Copy**, **Del**.
- **Type all in order** fires slots top-to-bottom with the Typing speed slider;
  **Stop** cancels mid-type on the page.
- Unassigned slots auto-match the first visible field on Type; Assign lets you
  click the exact field with a matte dark picker (no white, no gloss).

## Choosing where answers go (v3.5.0)

- **Fill target: Auto-match / I choose** (under Answers). Auto-match guesses the
  field, then draws numbered markers on the page that match the numbers in the
  confirm list. "I choose" makes you click the destination field for each answer.
- **🎯 Pick field** on any answer card: click the field on the page (Esc or the
  sidebar's Cancel to abort). Works on text boxes, dropdowns, radios and
  checkboxes (you can click an option's label).
- In the confirm list, **⌖ Show on page** scrolls to and flashes the field, and
  **🎯 Change field** lets you re-pick it. Nothing is typed until you hit Fill approved.
- Fixed: the "Autofill page" button always reported "Analyze a task first".
