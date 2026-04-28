const RAW_URL =
  "https://raw.githubusercontent.com/EvoLinkAI/awesome-gpt-image-2-prompts/main/gpt_image2_prompts.json";
const CACHE_KEY = "gip2PromptCache";
const CUSTOM_KEY = "gip2CustomPrompts";
const CATEGORIES_KEY = "gip2Categories";
const REMOTE_OVERRIDES_KEY = "gip2RemoteOverrides";
const HIDDEN_REMOTE_IDS_KEY = "gip2HiddenRemoteIds";
const UPDATE_KEY = "gip2RemoteUpdate";
const HASH_KEY = "gip2RemoteSignature";

let state = {
  categories: [],
  custom: [],
  remote: [],
  overrides: [],
  hiddenRemoteIds: [],
  activeCategory: "all",
  editing: null,
  filtered: [],
};

let toastTimer = null;

document.addEventListener("DOMContentLoaded", async () => {
  bindEvents();
  await loadState();
  render();
});

function bindEvents() {
  document.querySelector("[data-action='new-prompt']").addEventListener("click", () => safeOpenEditor());
  document.querySelector("[data-action='add-category']").addEventListener("click", addCategory);
  document.querySelector("[data-action='check-remote']").addEventListener("click", checkRemoteUpdates);
  document.querySelector("[data-action='clear-remote']").addEventListener("click", clearRemoteDownloads);
  document.querySelector("[data-action='export']").addEventListener("click", exportPrompts);
  document.querySelector("[data-action='close-editor']").addEventListener("click", closeEditor);
  document.querySelector("[data-action='auto-classify']").addEventListener("click", autoClassifyEditor);
  document.querySelector("[data-role='editor'] form").addEventListener("submit", saveEditor);
  document.querySelector("[data-role='search']").addEventListener("input", renderPromptList);
  document.querySelector("[data-role='source']").addEventListener("change", renderPromptList);
  document.querySelector("[data-role='sort']").addEventListener("change", renderPromptList);
  const promptList = document.querySelector("[data-role='prompt-list']");
  promptList.addEventListener("click", handlePromptListClick);
  promptList.addEventListener("dragstart", (event) => {
    const card = event.target.closest(".prompt-card");
    if (!card || event.target.closest("button")) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData("text/plain", card.dataset.id);
  });
}

async function loadState() {
  const stored = await chromeGet([
    CACHE_KEY,
    CUSTOM_KEY,
    CATEGORIES_KEY,
    REMOTE_OVERRIDES_KEY,
    HIDDEN_REMOTE_IDS_KEY,
    UPDATE_KEY,
  ]);
  state.categories = normalizeCategories(stored[CATEGORIES_KEY]);
  state.custom = normalizeList(stored[CUSTOM_KEY], "custom");
  state.overrides = normalizeList(stored[REMOTE_OVERRIDES_KEY], "remoteOverride");
  state.hiddenRemoteIds = Array.isArray(stored[HIDDEN_REMOTE_IDS_KEY]) ? stored[HIDDEN_REMOTE_IDS_KEY] : [];

  const cached = stored[CACHE_KEY];
  if (cached && Array.isArray(cached.items)) {
    state.remote = normalizeList(cached.items, "remote");
  } else {
    await checkRemoteUpdates(false);
  }

  renderRemoteStatus(stored[UPDATE_KEY]);
}

function normalizeCategories(items) {
  const base = [
    { id: "general", name: "通用", keywords: ["通用", "prompt", "image", "photo", "poster"] },
    { id: "portrait", name: "人像", keywords: ["人像", "portrait", "人物", "model", "写真"] },
    { id: "poster", name: "海报", keywords: ["海报", "poster", "banner", "封面", "小红书"] },
    { id: "style", name: "风格", keywords: ["风格", "style", "film", "cinematic", "水墨", "插画"] },
  ];
  const incoming = Array.isArray(items) ? items : [];
  const merged = [...base, ...incoming].filter(Boolean);
  const seen = new Set();
  return merged.filter((item) => {
    if (!item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function normalizeList(items, source) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item, index) => normalizePrompt({ ...item, source }, index))
    .filter(Boolean);
}

function normalizePrompt(item, index) {
  const text = String(item.text || "").trim();
  if (!text) return null;
  const id = String(item.id || `${item.source || "prompt"}-${index}`);
  return {
    id,
    remoteId: String(item.remoteId || (item.source === "remoteOverride" ? id : "")),
    title: String(item.title || "").trim(),
    author: String(item.author || (item.source === "custom" ? "me" : "unknown")),
    lang: String(item.lang || "zh").toLowerCase(),
    text,
    url: String(item.url || ""),
    likeCount: Number(item.likeCount || 0),
    createdAt: parseTime(item.createdAt),
    updatedAt: parseTime(item.updatedAt),
    source: item.source || "custom",
    categoryId: String(item.categoryId || ""),
    tags: Array.isArray(item.tags) ? item.tags.map(String).filter(Boolean) : [],
    media: Array.isArray(item.media) ? item.media : [],
  };
}

function getManagedPrompts() {
  const hidden = new Set(state.hiddenRemoteIds);
  const overrides = new Map(state.overrides.map((item) => [item.remoteId || item.id, item]));
  const remote = state.remote
    .filter((item) => !hidden.has(item.id))
    .map((item) => {
      const override = overrides.get(item.id);
      if (!override) return item;
      return {
        ...item,
        ...override,
        id: item.id,
        remoteId: item.id,
        source: "remote",
        remoteEdited: true,
        url: item.url,
        likeCount: item.likeCount,
      };
    });
  const visibleRemoteIds = new Set(remote.map((item) => item.id));
  const protectedOverrides = state.overrides
    .filter((item) => !visibleRemoteIds.has(item.remoteId || item.id))
    .map((item) => ({
      ...item,
      id: item.remoteId || item.id,
      source: "remote",
      remoteEdited: true,
    }));
  return [...state.custom.map((item) => ({ ...item, source: "custom" })), ...protectedOverrides, ...remote];
}

function render() {
  renderCategories();
  renderSummary();
  renderPromptList();
  hydrateCategorySelect();
}

function renderCategories() {
  const list = document.querySelector("[data-role='categories']");
  const prompts = getManagedPrompts();
  const rows = [
    { id: "all", name: "全部", keywords: [] },
    { id: "uncategorized", name: "未分类", keywords: [] },
    ...state.categories,
  ];
  list.innerHTML = rows
    .map((category) => {
      const count =
        category.id === "all"
          ? prompts.length
          : category.id === "uncategorized"
            ? prompts.filter((item) => !item.categoryId).length
            : prompts.filter((item) => item.categoryId === category.id).length;
      const actions =
        category.id === "all" || category.id === "uncategorized"
          ? ""
          : `<span class="category-actions">
              <button class="tiny" title="重命名" data-action="rename-category">✎</button>
              <button class="tiny" title="删除" data-action="delete-category">×</button>
            </span>`;
      return `<div class="category" data-id="${escapeAttr(category.id)}" data-active="${category.id === state.activeCategory}">
        <div><strong>${escapeHtml(category.name)}</strong><span>${count} 条</span></div>${actions}
      </div>`;
    })
    .join("");

  list.querySelectorAll(".category").forEach((node) => {
    node.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      state.activeCategory = node.dataset.id;
      render();
    });
    node.addEventListener("dragover", (event) => {
      event.preventDefault();
      node.dataset.drop = "true";
    });
    node.addEventListener("dragleave", () => {
      node.dataset.drop = "false";
    });
    node.addEventListener("drop", async (event) => {
      event.preventDefault();
      node.dataset.drop = "false";
      await assignPromptCategory(event.dataTransfer.getData("text/plain"), node.dataset.id);
    });
  });

  list.querySelectorAll("[data-action='rename-category']").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      const id = button.closest(".category").dataset.id;
      const category = state.categories.find((item) => item.id === id);
      const name = window.prompt("分类名称", category?.name || "");
      if (!name?.trim()) return;
      category.name = name.trim();
      await persistCategories();
      render();
    });
  });

  list.querySelectorAll("[data-action='delete-category']").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      const id = button.closest(".category").dataset.id;
      if (!window.confirm("删除分类？该分类下的 prompt 会变为未分类。")) return;
      state.categories = state.categories.filter((item) => item.id !== id);
      state.custom = state.custom.map((item) => (item.categoryId === id ? { ...item, categoryId: "" } : item));
      state.overrides = state.overrides.map((item) => (item.categoryId === id ? { ...item, categoryId: "" } : item));
      await persistAllManagement();
      render();
    });
  });
}

function renderSummary() {
  const prompts = getManagedPrompts();
  const editedRemote = state.overrides.length;
  document.querySelector("[data-role='summary']").innerHTML = `
    <div class="stat"><strong>${prompts.length}</strong><span>当前可用</span></div>
    <div class="stat"><strong>${state.custom.length}</strong><span>我的 Prompt</span></div>
    <div class="stat"><strong>${state.remote.length}</strong><span>远程缓存</span></div>
    <div class="stat"><strong>${editedRemote}</strong><span>本地覆盖远程</span></div>
  `;
}

function renderPromptList() {
  const search = document.querySelector("[data-role='search']").value.trim().toLowerCase();
  const source = document.querySelector("[data-role='source']").value;
  const sort = document.querySelector("[data-role='sort']").value;
  let prompts = getManagedPrompts();

  prompts = prompts.filter((item) => {
    const categoryMatch =
      state.activeCategory === "all" ||
      (state.activeCategory === "uncategorized" && !item.categoryId) ||
      item.categoryId === state.activeCategory;
    const sourceMatch =
      source === "all" ||
      item.source === source ||
      (source === "editedRemote" && item.remoteEdited);
    const haystack = `${item.title} ${item.text} ${item.author} ${item.lang} ${item.tags.join(" ")}`.toLowerCase();
    return categoryMatch && sourceMatch && (!search || haystack.includes(search));
  });

  prompts.sort((a, b) => {
    if (sort === "category") return getCategoryName(a.categoryId).localeCompare(getCategoryName(b.categoryId), "zh-CN");
    if (sort === "source") return a.source.localeCompare(b.source);
    if (sort === "length") return b.text.length - a.text.length;
    return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
  });

  state.filtered = prompts;
  const list = document.querySelector("[data-role='prompt-list']");
  list.innerHTML = prompts.length ? prompts.map(renderPromptCard).join("") : `<div class="stat">没有匹配的 prompt。</div>`;
}

function handlePromptListClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const card = button.closest(".prompt-card");
  if (!card) return;
  event.preventDefault();
  event.stopPropagation();

  const id = card.dataset.id;
  const action = button.dataset.action;
  if (action === "edit") {
    safeOpenEditor(id);
  } else if (action === "duplicate") {
    duplicatePrompt(id);
  } else if (action === "auto") {
    autoClassifyPrompt(id);
  } else if (action === "delete") {
    deletePrompt(id);
  }
}

function renderPromptCard(item) {
  const category = getCategoryName(item.categoryId) || "未分类";
  const title = item.title || item.text.slice(0, 42);
  const sourceLabel = item.source === "custom" ? "我的" : item.remoteEdited ? "远程已改" : "远程";
  const tags = item.tags.length ? `<div class="tags">${item.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : "";
  return `<article class="prompt-card" draggable="true" data-id="${escapeAttr(item.id)}">
    <div class="meta">
      <span class="pill ${item.source === "custom" ? "mine" : "remote"}">${sourceLabel}</span>
      <span class="pill">${escapeHtml(item.lang)}</span>
      <span class="pill">${escapeHtml(category)}</span>
    </div>
    <h2>${escapeHtml(title)}</h2>
    <div class="prompt-text">${escapeHtml(item.text)}</div>
    ${tags}
    <div class="card-actions">
      <button type="button" draggable="false" data-action="edit">编辑</button>
      <button type="button" draggable="false" data-action="duplicate">复制为我的</button>
      <button type="button" draggable="false" data-action="auto">自动分类</button>
      <button type="button" draggable="false" data-action="delete">删除</button>
    </div>
  </article>`;
}

function safeOpenEditor(id = null) {
  try {
    openEditor(id);
  } catch (error) {
    console.error(error);
    showToast(`编辑器打开失败：${error.message}`);
  }
}

function openEditor(id = null) {
  const dialog = document.querySelector("[data-role='editor']");
  const item = id ? getManagedPrompts().find((prompt) => prompt.id === id) : null;
  if (id && !item) {
    showToast("没有找到这条 prompt，请刷新管理页");
    return;
  }
  state.editing = item ? { id: item.id, source: item.source } : null;
  dialog.querySelector("[data-role='editor-title']").textContent = item ? "编辑 Prompt" : "新增 Prompt";
  dialog.querySelector("[data-field='title']").value = item?.title || "";
  dialog.querySelector("[data-field='sourceLabel']").value = item ? (item.source === "custom" ? "我的" : "远程本地覆盖") : "我的";
  dialog.querySelector("[data-field='lang']").value = item?.lang || "zh";
  dialog.querySelector("[data-field='categoryId']").value = item?.categoryId || "";
  dialog.querySelector("[data-field='tags']").value = item?.tags?.join(", ") || "";
  dialog.querySelector("[data-field='text']").value = item?.text || "";
  dialog.hidden = false;
  dialog.dataset.open = "true";
  dialog.querySelector("[data-field='title']").focus();
}

function closeEditor() {
  const dialog = document.querySelector("[data-role='editor']");
  dialog.dataset.open = "false";
  dialog.hidden = true;
  state.editing = null;
}

async function saveEditor(event) {
  event.preventDefault();
  const dialog = document.querySelector("[data-role='editor']");
  const title = dialog.querySelector("[data-field='title']").value.trim();
  const lang = dialog.querySelector("[data-field='lang']").value.trim().toLowerCase() || "zh";
  const categoryId = dialog.querySelector("[data-field='categoryId']").value;
  const tags = splitTags(dialog.querySelector("[data-field='tags']").value);
  const text = dialog.querySelector("[data-field='text']").value.trim();
  if (!text) {
    showToast("请输入 prompt 正文");
    return;
  }

  const now = Date.now();
  if (!state.editing) {
    state.custom.unshift({
      id: `custom-${now}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      author: "me",
      lang,
      categoryId,
      tags,
      text,
      createdAt: now,
      updatedAt: now,
      source: "custom",
      media: [],
    });
  } else if (state.editing.source === "custom") {
    state.custom = state.custom.map((item) =>
      item.id === state.editing.id ? { ...item, title, lang, categoryId, tags, text, updatedAt: now } : item,
    );
  } else {
    const remote = state.remote.find((item) => item.id === state.editing.id);
    const existing = state.overrides.find((item) => item.remoteId === state.editing.id);
    const override = {
      ...(existing || {}),
      id: existing?.id || `override-${state.editing.id}`,
      remoteId: state.editing.id,
      title,
      author: remote?.author || "remote",
      lang,
      categoryId,
      tags,
      text,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      source: "remoteOverride",
    };
    state.overrides = [override, ...state.overrides.filter((item) => item.remoteId !== state.editing.id)];
  }

  await persistAllManagement();
  closeEditor();
  render();
  showToast("已保存");
}

async function duplicatePrompt(id) {
  const item = getManagedPrompts().find((prompt) => prompt.id === id);
  if (!item) return;
  const now = Date.now();
  state.custom.unshift({
    ...item,
    id: `custom-${now}-${Math.random().toString(36).slice(2, 8)}`,
    title: item.title ? `${item.title} 副本` : "Prompt 副本",
    author: "me",
    source: "custom",
    remoteId: "",
    createdAt: now,
    updatedAt: now,
  });
  await persistAllManagement();
  render();
  showToast("已复制到我的 Prompt");
}

async function deletePrompt(id) {
  const item = getManagedPrompts().find((prompt) => prompt.id === id);
  if (!item) return;
  if (!window.confirm(`删除这个 prompt？\n\n${item.title || item.text.slice(0, 48)}`)) return;
  if (item.source === "custom") {
    state.custom = state.custom.filter((prompt) => prompt.id !== id);
  } else {
    state.hiddenRemoteIds = [...new Set([...state.hiddenRemoteIds, id])];
  }
  await persistAllManagement();
  render();
  showToast(item.source === "custom" ? "已删除" : "已隐藏远程 prompt");
}

async function assignPromptCategory(id, categoryId) {
  if (!id || categoryId === "all") return;
  const targetCategory = categoryId === "uncategorized" ? "" : categoryId;
  const item = getManagedPrompts().find((prompt) => prompt.id === id);
  if (!item) return;
  if (item.source === "custom") {
    state.custom = state.custom.map((prompt) => (prompt.id === id ? { ...prompt, categoryId: targetCategory, updatedAt: Date.now() } : prompt));
  } else {
    await upsertRemoteOverride(id, { categoryId: targetCategory });
  }
  await persistAllManagement();
  render();
}

async function autoClassifyPrompt(id) {
  const item = getManagedPrompts().find((prompt) => prompt.id === id);
  if (!item) return;
  const categoryId = inferCategory(item);
  if (!categoryId) {
    showToast("没有匹配到合适分类");
    return;
  }
  await assignPromptCategory(id, categoryId);
  showToast(`已归类到 ${getCategoryName(categoryId)}`);
}

function autoClassifyEditor() {
  const dialog = document.querySelector("[data-role='editor']");
  const probe = {
    title: dialog.querySelector("[data-field='title']").value,
    text: dialog.querySelector("[data-field='text']").value,
    tags: splitTags(dialog.querySelector("[data-field='tags']").value),
  };
  const categoryId = inferCategory(probe);
  if (!categoryId) {
    showToast("没有匹配到合适分类");
    return;
  }
  dialog.querySelector("[data-field='categoryId']").value = categoryId;
}

function inferCategory(item) {
  const text = `${item.title || ""} ${item.text || ""} ${(item.tags || []).join(" ")}`.toLowerCase();
  let best = { id: "", score: 0 };
  for (const category of state.categories) {
    const score = (category.keywords || []).reduce((sum, keyword) => {
      return text.includes(String(keyword).toLowerCase()) ? sum + 1 : sum;
    }, 0);
    if (score > best.score) best = { id: category.id, score };
  }
  return best.id;
}

async function upsertRemoteOverride(remoteId, patch) {
  const remote = state.remote.find((item) => item.id === remoteId);
  const existing = state.overrides.find((item) => item.remoteId === remoteId);
  if (!remote && !existing) return;
  const now = Date.now();
  const override = {
    ...(existing || {
      id: `override-${remoteId}`,
      remoteId,
      title: remote?.title || "",
      author: remote?.author || "remote",
      lang: remote?.lang || "zh",
      categoryId: remote?.categoryId || "",
      tags: remote?.tags || [],
      text: remote?.text || "",
      createdAt: now,
      source: "remoteOverride",
    }),
    ...patch,
    updatedAt: now,
  };
  state.overrides = [override, ...state.overrides.filter((item) => item.remoteId !== remoteId)];
}

async function addCategory() {
  const name = window.prompt("分类名称");
  if (!name?.trim()) return;
  const keywords = window.prompt("自动分类关键词，用逗号分隔", name.trim()) || name.trim();
  state.categories.push({
    id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim(),
    keywords: splitTags(keywords),
  });
  await persistCategories();
  render();
}

async function clearRemoteDownloads() {
  if (!window.confirm("清空远程下载的 prompt？已修改过的远程 prompt 会保留你的本地覆盖版本。")) return;
  const remoteIds = state.remote.map((item) => item.id);
  state.hiddenRemoteIds = [...new Set([...state.hiddenRemoteIds, ...remoteIds])];
  state.remote = [];
  await chromeSet({ [CACHE_KEY]: { savedAt: 0, items: [] }, [HIDDEN_REMOTE_IDS_KEY]: state.hiddenRemoteIds });
  render();
  showToast("已清空远程下载");
}

async function checkRemoteUpdates(showDone = true) {
  try {
    const response = await fetch(`${RAW_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const items = await response.json();
    const remote = normalizeList(items, "remote");
    const latest = makeSignature(items);
    const stored = await chromeGet(HASH_KEY);
    const previous = stored[HASH_KEY];
    const update = {
      hasUpdate: Boolean(previous && previous.hash !== latest.hash),
      checkedAt: Date.now(),
      previous,
      latest,
    };
    state.remote = remote;
    await chromeSet({ [CACHE_KEY]: { savedAt: Date.now(), items }, [HASH_KEY]: latest, [UPDATE_KEY]: update });
    renderRemoteStatus(update);
    render();
    if (showDone) showToast(update.hasUpdate ? "发现远程更新" : "远程库已是最新");
  } catch (error) {
    renderRemoteStatus({ error: error.message, checkedAt: Date.now() });
    if (showDone) showToast(`检查失败：${error.message}`);
  }
}

function renderRemoteStatus(update) {
  const node = document.querySelector("[data-role='remote-status']");
  if (!node) return;
  if (!update) {
    node.textContent = "尚未检查。";
    return;
  }
  if (update.error) {
    node.textContent = `上次检查失败：${update.error}`;
    return;
  }
  const time = update.checkedAt ? new Date(update.checkedAt).toLocaleString() : "未知时间";
  node.textContent = update.hasUpdate ? `发现远程更新，检查时间：${time}` : `无新更新，检查时间：${time}`;
}

function exportPrompts() {
  const format = document.querySelector("[data-role='export-format']").value;
  const prompts = state.filtered.length ? state.filtered : getManagedPrompts();
  const filename = `gpt-image-2-prompts-${new Date().toISOString().slice(0, 10)}.${format === "markdown" ? "md" : format}`;
  const content = serializePrompts(prompts, format);
  const type = format === "json" ? "application/json" : "text/plain";
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function serializePrompts(prompts, format) {
  const clean = prompts.map((item) => ({
    title: item.title,
    source: item.source,
    category: getCategoryName(item.categoryId),
    lang: item.lang,
    tags: item.tags,
    text: item.text,
    url: item.url,
  }));
  if (format === "json") return JSON.stringify(clean, null, 2);
  if (format === "csv") {
    return [
      ["title", "source", "category", "lang", "tags", "text", "url"].join(","),
      ...clean.map((item) =>
        [item.title, item.source, item.category, item.lang, item.tags.join("|"), item.text, item.url]
          .map(csvCell)
          .join(","),
      ),
    ].join("\n");
  }
  if (format === "markdown") {
    return clean
      .map((item) => `## ${item.title || "Untitled"}\n\n- 来源：${item.source}\n- 分类：${item.category || "未分类"}\n- 语言：${item.lang}\n- 标签：${item.tags.join(", ")}\n\n${item.text}\n`)
      .join("\n");
  }
  return clean.map((item) => `${item.title || "Untitled"}\n[${item.source} / ${item.category || "未分类"} / ${item.lang}]\n${item.text}\n`).join("\n---\n");
}

function hydrateCategorySelect() {
  const select = document.querySelector("[data-field='categoryId']");
  select.innerHTML = `<option value="">未分类</option>${state.categories
    .map((category) => `<option value="${escapeAttr(category.id)}">${escapeHtml(category.name)}</option>`)
    .join("")}`;
}

function getCategoryName(id) {
  return state.categories.find((item) => item.id === id)?.name || "";
}

async function persistCategories() {
  await chromeSet({ [CATEGORIES_KEY]: state.categories });
}

async function persistAllManagement() {
  await chromeSet({
    [CUSTOM_KEY]: state.custom,
    [CATEGORIES_KEY]: state.categories,
    [REMOTE_OVERRIDES_KEY]: state.overrides,
    [HIDDEN_REMOTE_IDS_KEY]: state.hiddenRemoteIds,
  });
}

function splitTags(value) {
  return String(value || "")
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function makeSignature(items) {
  const normalized = Array.isArray(items)
    ? items.map((item) => `${item.id || ""}:${item.text || ""}:${item.likeCount || 0}`).join("|")
    : "";
  return { count: Array.isArray(items) ? items.length : 0, hash: hashString(normalized), updatedAt: Date.now() };
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function parseTime(value) {
  if (!value) return 0;
  if (typeof value === "number") return value;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function showToast(message) {
  const toast = document.querySelector("[data-role='toast']");
  toast.textContent = message;
  toast.dataset.open = "true";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.dataset.open = "false";
  }, 2600);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function chromeGet(key) {
  return new Promise((resolve) => chrome.storage.local.get(key, resolve));
}

function chromeSet(value) {
  return new Promise((resolve) => chrome.storage.local.set(value, resolve));
}
