const RAW_URL =
  "https://raw.githubusercontent.com/EvoLinkAI/awesome-gpt-image-2-prompts/main/gpt_image2_prompts.json";
const CACHE_KEY = "gip2PromptCache";
const UPDATE_KEY = "gip2RemoteUpdate";
const HASH_KEY = "gip2RemoteSignature";

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("gip2-remote-check", { periodInMinutes: 360 });
  checkRemoteUpdates();
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create("gip2-remote-check", { periodInMinutes: 360 });
  checkRemoteUpdates();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "gip2-remote-check") checkRemoteUpdates();
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "open-prompt-manager") chrome.runtime.openOptionsPage();
});

async function checkRemoteUpdates() {
  try {
    const response = await fetch(`${RAW_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const items = await response.json();
    const signature = makeSignature(items);
    const stored = await chromeGet([HASH_KEY, UPDATE_KEY, CACHE_KEY]);
    const previous = stored[HASH_KEY];

    await chromeSet({
      [HASH_KEY]: signature,
      [CACHE_KEY]: { savedAt: Date.now(), items },
      [UPDATE_KEY]: {
        hasUpdate: Boolean(previous && previous.hash !== signature.hash),
        checkedAt: Date.now(),
        previous,
        latest: signature,
      },
    });
  } catch (error) {
    await chromeSet({
      [UPDATE_KEY]: {
        hasUpdate: false,
        checkedAt: Date.now(),
        error: error.message,
      },
    });
  }
}

function makeSignature(items) {
  const normalized = Array.isArray(items)
    ? items.map((item) => `${item.id || ""}:${item.text || ""}:${item.likeCount || 0}`).join("|")
    : "";
  return {
    count: Array.isArray(items) ? items.length : 0,
    hash: hashString(normalized),
    updatedAt: Date.now(),
  };
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function chromeGet(key) {
  return new Promise((resolve) => chrome.storage.local.get(key, resolve));
}

function chromeSet(value) {
  return new Promise((resolve) => chrome.storage.local.set(value, resolve));
}
