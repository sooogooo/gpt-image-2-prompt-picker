const REMOTE_SOURCES = [
  {
    id: "evolink",
    name: "EvoLinkAI",
    url: "https://raw.githubusercontent.com/EvoLinkAI/awesome-gpt-image-2-prompts/main/gpt_image2_prompts.json",
    homepage: "https://github.com/EvoLinkAI/awesome-gpt-image-2-prompts",
  },
  {
    id: "xiaobin",
    name: "GPT Image Wiki",
    url: "https://raw.githubusercontent.com/xiaobin1976/GPT_image/main/site/library/catalog.json",
    homepage: "https://github.com/xiaobin1976/GPT_image",
  },
];
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
  if (command === "open-prompt-manager") openPromptManager();
});

chrome.action.onClicked.addListener(() => {
  openPromptManager();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "gip2-open-manager") return false;
  openPromptManager()
    .then(() => sendResponse({ ok: true }))
    .catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});

async function checkRemoteUpdates() {
  try {
    const items = await fetchRemotePrompts();
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

async function fetchRemotePrompts() {
  const results = await Promise.allSettled(
    REMOTE_SOURCES.map(async (source) => {
      const response = await fetch(`${source.url}?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`${source.name} HTTP ${response.status}`);
      const payload = await response.json();
      return parseRemotePayload(payload, source);
    }),
  );
  const items = results
    .filter((result) => result.status === "fulfilled")
    .flatMap((result) => result.value);
  if (!items.length) {
    throw new Error(
      results
        .filter((result) => result.status === "rejected")
        .map((result) => result.reason?.message || String(result.reason))
        .join("; "),
    );
  }
  return items;
}

function parseRemotePayload(payload, source) {
  if (Array.isArray(payload)) {
    return payload.map((item, index) => ({ ...item, id: `${source.id}-${item.id || index}`, sourceName: source.name }));
  }

  const cases = Array.isArray(payload?.cases)
    ? payload.cases.map((item, index) => ({
        id: `${source.id}-case-${item.id || index}`,
        title: item.title,
        author: item.source || source.name,
        lang: /[a-zA-Z]{20,}/.test(item.prompt || "") ? "mixed" : "zh",
        text: item.prompt,
        url: item.sourcePath ? `${source.homepage}/blob/main/${item.sourcePath.split("#")[0]}` : source.homepage,
        likeCount: 0,
        createdAt: payload.generatedAt,
        sourceName: source.name,
        categoryId: item.categoryId || "",
        tags: [item.volume, item.categoryId].filter(Boolean),
        media: item.image
          ? [{ url: `https://raw.githubusercontent.com/xiaobin1976/GPT_image/main/site/library/images/${item.image}` }]
          : [],
      }))
    : [];

  const templates = Array.isArray(payload?.templates)
    ? payload.templates
        .map((item, index) => ({
          id: `${source.id}-template-${item.id || index}`,
          title: item.title || item.name,
          author: source.name,
          lang: "zh",
          text: item.prompt || item.template || item.markdown || item.content || item.rawMarkdown,
          url: source.homepage,
          likeCount: 0,
          createdAt: payload.generatedAt,
          sourceName: `${source.name} Template`,
          categoryId: item.categoryId || "",
          tags: ["template", item.categoryId].filter(Boolean),
          media: [],
        }))
        .filter((item) => item.text)
    : [];

  return [...cases, ...templates].filter((item) => item.text);
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

async function openPromptManager() {
  const url = chrome.runtime.getURL("options.html");
  const tabs = await chrome.tabs.query({ url });
  if (tabs[0]?.id) {
    await chrome.tabs.update(tabs[0].id, { active: true });
    if (tabs[0].windowId) await chrome.windows.update(tabs[0].windowId, { focused: true });
    return;
  }
  await chrome.tabs.create({ url });
}

function chromeGet(key) {
  return new Promise((resolve) => chrome.storage.local.get(key, resolve));
}

function chromeSet(value) {
  return new Promise((resolve) => chrome.storage.local.set(value, resolve));
}
