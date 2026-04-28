(() => {
  const RAW_URL =
    "https://raw.githubusercontent.com/EvoLinkAI/awesome-gpt-image-2-prompts/main/gpt_image2_prompts.json";
  const CACHE_KEY = "gip2PromptCache";
  const CUSTOM_KEY = "gip2CustomPrompts";
  const CATEGORIES_KEY = "gip2Categories";
  const REMOTE_OVERRIDES_KEY = "gip2RemoteOverrides";
  const HIDDEN_REMOTE_IDS_KEY = "gip2HiddenRemoteIds";
  const UPDATE_KEY = "gip2RemoteUpdate";
  const CACHE_TTL = 1000 * 60 * 60 * 6;
  const MAX_ITEMS = 500;

  const fallbackPrompts = [
    {
      id: "fallback-encyclopedia-card",
      author: "MrLarus",
      lang: "zh",
      likeCount: 441,
      url: "https://github.com/EvoLinkAI/awesome-gpt-image-2-prompts",
      text:
        "请根据〖主题〗生成一张高质量竖版「科普百科图」。这张图不是普通海报，也不是单纯插画，而是一张兼具图鉴感、百科感、信息结构感、收藏感的模块化科普信息图。浅色干净背景，柔和配色，轻阴影，圆角信息框，信息密度高但不拥挤。",
      media: [],
    },
    {
      id: "fallback-ink-poster",
      author: "liyue_ai",
      lang: "zh",
      likeCount: 46,
      url: "https://github.com/EvoLinkAI/awesome-gpt-image-2-prompts",
      text:
        "新中式水墨山水海报，竖版9:16构图，东方极简美学风格，大面积留白，春日清晨氛围，低饱和、清透柔和，高级质感。画面主体为奇峻群山、镜面湖水、小木舟和红衣人物，整体空灵湿润、宁静，8K超清细节。",
      media: [],
    },
    {
      id: "fallback-film-portrait",
      author: "BubbleBrain",
      lang: "en",
      likeCount: 363,
      url: "https://github.com/EvoLinkAI/awesome-gpt-image-2-prompts",
      text:
        "Analog 35mm film photography, soft airy Japanese-style aesthetic, gentle diffused natural window light, slight overexposure, pastel tones, low contrast, soft highlights, minimal indoor setting, natural composition, subtle film grain, dreamy and understated atmosphere --ar 9:16",
      media: [],
    },
  ];

  let prompts = [];
  let remotePrompts = [];
  let customPrompts = [];
  let categories = [];
  let remoteOverrides = [];
  let hiddenRemoteIds = [];
  let filtered = [];
  let activeId = null;
  let editingCustomId = null;
  let toastTimer = null;

  const iconSparkles = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3l1.7 4.7L18 9.4l-4.3 1.7L12 16l-1.7-4.9L6 9.4l4.3-1.7L12 3z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14zM5 15l.7 1.8 1.8.7-1.8.7L5 20l-.7-1.8-1.8-.7 1.8-.7L5 15z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
  const iconX = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  const iconRefresh = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 6v5h-5M4 18v-5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.1 11A6.5 6.5 0 0 0 7 6.4L4 9.2M5.9 13A6.5 6.5 0 0 0 17 17.6l3-2.8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const iconCopy = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" stroke-width="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  const iconSend = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const iconExternal = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 3h7v7M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  const iconPlus = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  const iconEdit = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 20h9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;
  const iconTrash = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M9 11v6M15 11v6M6 6l1 15h10l1-15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  function createUi() {
    if (document.querySelector(".gip2-launcher")) return;

    const launcher = document.createElement("button");
    launcher.className = "gip2-launcher";
    launcher.type = "button";
    launcher.title = "GPT Image 2 提示词库";
    launcher.innerHTML = iconSparkles;

    const composerButton = document.createElement("button");
    composerButton.className = "gip2-composer-btn";
    composerButton.type = "button";
    composerButton.title = "选择 GPT Image 2 提示词";
    composerButton.innerHTML = `${iconSparkles}<span>Prompt</span>`;

    const panel = document.createElement("section");
    panel.className = "gip2-panel";
    panel.innerHTML = `
      <header class="gip2-header">
        <div class="gip2-title">
          <strong>GPT Image 2 提示词</strong>
          <span data-role="status">正在加载提示词库...</span>
        </div>
        <button class="gip2-icon-btn" type="button" title="关闭" data-action="close">${iconX}</button>
      </header>
      <div class="gip2-controls">
        <input class="gip2-search" data-role="search" placeholder="搜索提示词、作者、语言..." />
        <div class="gip2-tabs" role="tablist" aria-label="提示词来源">
          <button class="gip2-tab" type="button" data-source="all" data-active="true">全部</button>
          <button class="gip2-tab" type="button" data-source="custom">我的</button>
          <button class="gip2-tab" type="button" data-source="remote">远程库</button>
        </div>
        <div class="gip2-row">
          <select class="gip2-select" data-role="lang">
            <option value="all">全部语言</option>
          </select>
          <select class="gip2-select" data-role="sort">
            <option value="likes">按热度</option>
            <option value="recent">按时间</option>
            <option value="length">按长度</option>
          </select>
          <button class="gip2-icon-btn" type="button" title="新增 prompt" data-action="new">${iconPlus}</button>
          <button class="gip2-icon-btn" type="button" title="打开管理页" data-action="manage">${iconEdit}</button>
          <button class="gip2-icon-btn" type="button" title="刷新" data-action="refresh">${iconRefresh}</button>
        </div>
        <form class="gip2-form" data-role="form" hidden>
          <input class="gip2-input" data-field="title" maxlength="80" placeholder="名称，例如：小红书封面图" />
          <div class="gip2-row">
            <input class="gip2-input" data-field="lang" maxlength="12" placeholder="语言，例如：zh" />
            <input class="gip2-input" data-field="tags" maxlength="120" placeholder="标签，用逗号分隔" />
          </div>
          <textarea class="gip2-textarea" data-field="text" rows="6" placeholder="输入你的 prompt 正文"></textarea>
          <div class="gip2-form-actions">
            <button class="gip2-btn gip2-btn-primary" type="submit">保存</button>
            <button class="gip2-btn" type="button" data-action="cancel-edit">取消</button>
          </div>
        </form>
      </div>
      <div class="gip2-list" data-role="list"></div>
      <footer class="gip2-footer">
        <div class="gip2-preview" data-role="preview">选择一条提示词后可预览全文。</div>
        <div class="gip2-actions">
          <button class="gip2-btn gip2-btn-primary" type="button" data-action="apply">${iconSend}<span>应用</span></button>
          <button class="gip2-btn" type="button" data-action="copy">${iconCopy}<span>复制</span></button>
          <button class="gip2-btn" type="button" title="打开来源" data-action="source">${iconExternal}</button>
        </div>
      </footer>
    `;

    const toast = document.createElement("div");
    toast.className = "gip2-toast";

    document.body.append(launcher, composerButton, panel, toast);

    launcher.addEventListener("click", () => togglePanel());
    composerButton.addEventListener("click", () => togglePanel(true));
    panel.querySelector('[data-action="close"]').addEventListener("click", () => {
      togglePanel(false);
    });
    panel.querySelector('[data-action="refresh"]').addEventListener("click", () => loadPrompts(true));
    panel.querySelector('[data-action="new"]').addEventListener("click", () => openPromptForm());
    panel.querySelector('[data-action="manage"]').addEventListener("click", openManager);
    panel.querySelector('[data-action="cancel-edit"]').addEventListener("click", closePromptForm);
    panel.querySelector('[data-role="form"]').addEventListener("submit", savePromptFromForm);
    panel.querySelector('[data-action="apply"]').addEventListener("click", applyActivePrompt);
    panel.querySelector('[data-action="copy"]').addEventListener("click", copyActivePrompt);
    panel.querySelector('[data-action="source"]').addEventListener("click", openActiveSource);

    panel.querySelector('[data-role="search"]').addEventListener("input", renderList);
    panel.querySelector('[data-role="lang"]').addEventListener("change", renderList);
    panel.querySelector('[data-role="sort"]').addEventListener("change", renderList);
    panel.querySelectorAll(".gip2-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        panel.querySelectorAll(".gip2-tab").forEach((item) => {
          item.dataset.active = String(item === tab);
        });
        renderList();
      });
    });

    installComposerButtonTracker();
  }

  function togglePanel(open) {
    const panel = document.querySelector(".gip2-panel");
    if (!panel) return;
    const nextOpen = typeof open === "boolean" ? open : panel.dataset.open !== "true";
    panel.dataset.open = String(nextOpen);
    if (nextOpen) {
      panel.querySelector('[data-role="search"]')?.focus();
    }
  }

  function installComposerButtonTracker() {
    const update = debounce(updateComposerButtonPosition, 120);
    update();
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("scroll", update, { passive: true });
    document.addEventListener("focusin", update, true);

    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function updateComposerButtonPosition() {
    const button = document.querySelector(".gip2-composer-btn");
    const target = findComposer();
    if (!button || !target || target.closest(".gip2-panel")) {
      if (button) button.dataset.visible = "false";
      return;
    }

    const rect = target.getBoundingClientRect();
    if (rect.width < 120 || rect.height < 20 || rect.bottom < 0 || rect.top > window.innerHeight) {
      button.dataset.visible = "false";
      return;
    }

    const width = window.innerWidth <= 640 ? 40 : 76;
    const left = Math.max(8, Math.min(window.innerWidth - width - 8, rect.left + 8));
    const top = Math.max(8, Math.min(window.innerHeight - 40, rect.top - 40));
    button.style.left = `${Math.round(left)}px`;
    button.style.top = `${Math.round(top)}px`;
    button.dataset.visible = "true";
  }

  function normalizePrompt(item, index) {
    const text = String(item.text || "").trim();
    if (!text) return null;
    return {
      id: String(item.id || `prompt-${index}`),
      title: String(item.title || "").trim(),
      author: String(item.author || "unknown"),
      lang: String(item.lang || "und").toLowerCase(),
      text,
      url: String(item.url || ""),
      likeCount: Number(item.likeCount || 0),
      retweetCount: Number(item.retweetCount || 0),
      viewCount: Number(item.viewCount || 0),
      createdAt: parseTime(item.createdAt),
      updatedAt: parseTime(item.updatedAt),
      source: item.source === "custom" ? "custom" : "remote",
      tags: Array.isArray(item.tags) ? item.tags.map(String).filter(Boolean) : [],
      categoryId: String(item.categoryId || ""),
      remoteId: String(item.remoteId || ""),
      remoteEdited: Boolean(item.remoteEdited),
      media: Array.isArray(item.media) ? item.media.filter((media) => media && media.url).slice(0, 4) : [],
    };
  }

  async function chromeGet(key) {
    return new Promise((resolve) => chrome.storage.local.get(key, resolve));
  }

  async function chromeSet(value) {
    return new Promise((resolve) => chrome.storage.local.set(value, resolve));
  }

  async function loadPrompts(force = false) {
    setStatus("正在加载提示词库...");
    await loadLocalManagementState();
    try {
      if (!force) {
        const cached = await chromeGet(CACHE_KEY);
        const payload = cached[CACHE_KEY];
        if (payload && Date.now() - payload.savedAt < CACHE_TTL && Array.isArray(payload.items)) {
          remotePrompts = applyManagedRemoteState(
            payload.items.map((item, index) => normalizePrompt({ ...item, source: "remote" }, index)).filter(Boolean),
          );
          setPrompts("已从缓存加载");
          return;
        }
      }

      const response = await fetch(`${RAW_URL}?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      const items = json
        .map((item, index) => normalizePrompt({ ...item, source: "remote" }, index))
        .filter(Boolean)
        .slice(0, MAX_ITEMS);
      await chromeSet({ [CACHE_KEY]: { savedAt: Date.now(), items } });
      remotePrompts = applyManagedRemoteState(items);
      setPrompts("已加载 GitHub 最新数据");
    } catch (error) {
      remotePrompts = applyManagedRemoteState(fallbackPrompts
        .map((item, index) => normalizePrompt({ ...item, source: "remote" }, index))
        .filter(Boolean));
      setPrompts("加载远程数据失败，使用内置样例");
      showToast(`远程提示词库加载失败：${error.message}`);
    }
  }

  async function loadCustomPrompts() {
    const stored = await chromeGet(CUSTOM_KEY);
    const items = Array.isArray(stored[CUSTOM_KEY]) ? stored[CUSTOM_KEY] : [];
    return items
      .map((item, index) => normalizePrompt({ ...item, source: "custom" }, index))
      .filter(Boolean)
      .sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
  }

  async function loadLocalManagementState() {
    const stored = await chromeGet([CUSTOM_KEY, CATEGORIES_KEY, REMOTE_OVERRIDES_KEY, HIDDEN_REMOTE_IDS_KEY, UPDATE_KEY]);
    categories = Array.isArray(stored[CATEGORIES_KEY]) ? stored[CATEGORIES_KEY] : [];
    remoteOverrides = Array.isArray(stored[REMOTE_OVERRIDES_KEY]) ? stored[REMOTE_OVERRIDES_KEY] : [];
    hiddenRemoteIds = Array.isArray(stored[HIDDEN_REMOTE_IDS_KEY]) ? stored[HIDDEN_REMOTE_IDS_KEY] : [];
    customPrompts = await loadCustomPrompts();
    if (stored[UPDATE_KEY]?.hasUpdate) {
      showToast("远程提示词库有更新，可在管理页查看");
    }
  }

  function applyManagedRemoteState(items) {
    const hidden = new Set(hiddenRemoteIds);
    const overrides = new Map(remoteOverrides.map((item) => [item.remoteId || item.id, item]));
    return items
      .filter((item) => !hidden.has(item.id))
      .map((item) => {
        const override = overrides.get(item.id);
        if (!override) return item;
        return normalizePrompt(
          {
            ...item,
            ...override,
            id: item.id,
            source: "remote",
            title: override.title || item.title,
            text: override.text || item.text,
            lang: override.lang || item.lang,
            tags: override.tags || item.tags,
            categoryId: override.categoryId || item.categoryId,
            remoteEdited: true,
          },
          0,
        );
      });
  }

  async function persistCustomPrompts() {
    await chromeSet({ [CUSTOM_KEY]: customPrompts });
  }

  function setPrompts(status) {
    prompts = [...customPrompts, ...getOrphanRemoteOverrides(), ...remotePrompts];
    activeId = prompts[0]?.id || null;
    hydrateLangFilter();
    renderList();
    setStatus(`${status}，共 ${prompts.length} 条，我的 ${customPrompts.length} 条`);
  }

  function getOrphanRemoteOverrides() {
    const remoteIds = new Set(remotePrompts.map((item) => item.id));
    return remoteOverrides
      .filter((item) => !remoteIds.has(item.remoteId || item.id))
      .map((item, index) =>
        normalizePrompt(
          {
            ...item,
            id: item.remoteId || item.id || `override-${index}`,
            source: "remote",
            remoteEdited: true,
          },
          index,
        ),
      )
      .filter(Boolean);
  }

  function hydrateLangFilter() {
    const select = document.querySelector('[data-role="lang"]');
    if (!select) return;
    const previous = select.value;
    const langs = [...new Set(prompts.map((item) => item.lang).filter(Boolean))].sort();
    select.innerHTML = `<option value="all">全部语言</option>${langs
      .map((lang) => `<option value="${escapeHtml(lang)}">${escapeHtml(lang)}</option>`)
      .join("")}`;
    select.value = langs.includes(previous) ? previous : "all";
  }

  function renderList() {
    const panel = document.querySelector(".gip2-panel");
    if (!panel) return;
    const list = panel.querySelector('[data-role="list"]');
    const search = panel.querySelector('[data-role="search"]').value.trim().toLowerCase();
    const lang = panel.querySelector('[data-role="lang"]').value;
    const sort = panel.querySelector('[data-role="sort"]').value;
    const source = panel.querySelector(".gip2-tab[data-active='true']")?.dataset.source || "all";

    filtered = prompts.filter((item) => {
      const matchesLang = lang === "all" || item.lang === lang;
      const matchesSource = source === "all" || item.source === source;
      const haystack = `${item.title} ${item.text} ${item.author} ${item.lang} ${item.tags.join(" ")}`.toLowerCase();
      return matchesLang && matchesSource && (!search || haystack.includes(search));
    });

    filtered.sort((a, b) => {
      if (a.source !== b.source) return a.source === "custom" ? -1 : 1;
      if (sort === "recent") return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
      if (sort === "length") return b.text.length - a.text.length;
      return b.likeCount - a.likeCount;
    });

    if (!filtered.some((item) => item.id === activeId)) activeId = filtered[0]?.id || null;

    list.innerHTML = filtered.length
      ? filtered.map(renderCard).join("")
      : `<div class="gip2-empty">没有匹配的提示词。</div>`;

    list.querySelectorAll(".gip2-card").forEach((card) => {
      card.addEventListener("click", () => {
        activeId = card.dataset.id;
        renderList();
      });
      card.addEventListener("dblclick", applyActivePrompt);
    });

    list.querySelectorAll("[data-action='edit-custom']").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        openPromptForm(button.closest(".gip2-card")?.dataset.id);
      });
    });

    list.querySelectorAll("[data-action='delete-custom']").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        deleteCustomPrompt(button.closest(".gip2-card")?.dataset.id);
      });
    });

    renderPreview();
  }

  function renderCard(item) {
    const media = item.media.length
      ? `<div class="gip2-card-media">${item.media
          .map((media) => `<img alt="" loading="lazy" src="${escapeAttr(media.url)}" />`)
          .join("")}</div>`
      : "";
    const title = item.title ? `<strong class="gip2-card-title">${escapeHtml(item.title)}</strong>` : "";
    const category = categories.find((entry) => entry.id === item.categoryId);
    const categoryBadge = category ? `<span class="gip2-source">${escapeHtml(category.name)}</span>` : "";
    const tags = item.tags.length
      ? `<div class="gip2-tags">${item.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>`
      : "";
    const manageActions =
      item.source === "custom"
        ? `<div class="gip2-card-actions">
            <button class="gip2-mini-btn" type="button" title="编辑" data-action="edit-custom">${iconEdit}</button>
            <button class="gip2-mini-btn gip2-danger" type="button" title="删除" data-action="delete-custom">${iconTrash}</button>
          </div>`
        : "";
    return `
      <article class="gip2-card" data-id="${escapeAttr(item.id)}" data-active="${item.id === activeId}">
        <div class="gip2-meta">
          <span class="gip2-pill">${escapeHtml(item.lang)}</span>
          <span class="gip2-source" data-source="${escapeAttr(item.source)}">${item.source === "custom" ? "我的" : "远程"}</span>
          ${categoryBadge}
          <span class="gip2-author">@${escapeHtml(item.author)}</span>
          <span>${formatNumber(item.likeCount)} likes</span>
          ${manageActions}
        </div>
        ${title}
        <div class="gip2-card-text">${escapeHtml(item.text)}</div>
        ${tags}
        ${media}
      </article>
    `;
  }

  function renderPreview() {
    const preview = document.querySelector('[data-role="preview"]');
    if (!preview) return;
    const item = getActivePrompt();
    preview.textContent = item ? item.text : "选择一条提示词后可预览全文。";
  }

  function getActivePrompt() {
    return filtered.find((item) => item.id === activeId) || prompts.find((item) => item.id === activeId);
  }

  function openPromptForm(id = null) {
    const form = document.querySelector('[data-role="form"]');
    if (!form) return;
    const item = id ? customPrompts.find((prompt) => prompt.id === id) : null;
    editingCustomId = item?.id || null;
    form.hidden = false;
    form.querySelector('[data-field="title"]').value = item?.title || "";
    form.querySelector('[data-field="lang"]').value = item?.lang || "zh";
    form.querySelector('[data-field="tags"]').value = item?.tags?.join(", ") || "";
    form.querySelector('[data-field="text"]').value = item?.text || "";
    form.querySelector('[type="submit"]').textContent = editingCustomId ? "保存修改" : "新增";
    form.querySelector('[data-field="title"]').focus();
  }

  function closePromptForm() {
    const form = document.querySelector('[data-role="form"]');
    if (!form) return;
    editingCustomId = null;
    form.reset();
    form.hidden = true;
  }

  async function savePromptFromForm(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const title = form.querySelector('[data-field="title"]').value.trim();
    const lang = form.querySelector('[data-field="lang"]').value.trim().toLowerCase() || "zh";
    const tags = form
      .querySelector('[data-field="tags"]')
      .value.split(/[,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 8);
    const text = form.querySelector('[data-field="text"]').value.trim();

    if (!text) {
      showToast("请输入 prompt 正文");
      return;
    }

    const now = Date.now();
    if (editingCustomId) {
      customPrompts = customPrompts.map((item) =>
        item.id === editingCustomId
          ? { ...item, title, lang, tags, text, updatedAt: now, source: "custom" }
          : item,
      );
      activeId = editingCustomId;
      showToast("已保存修改");
    } else {
      const item = {
        id: `custom-${now}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        author: "me",
        lang,
        text,
        url: "",
        likeCount: 0,
        retweetCount: 0,
        viewCount: 0,
        createdAt: now,
        updatedAt: now,
        source: "custom",
        tags,
        media: [],
      };
      customPrompts = [item, ...customPrompts];
      activeId = item.id;
      showToast("已新增到我的 prompt");
    }

    await persistCustomPrompts();
    prompts = [...customPrompts, ...remotePrompts];
    hydrateLangFilter();
    closePromptForm();
    showSourceTab("custom");
    renderList();
    setStatus(`共 ${prompts.length} 条，我的 ${customPrompts.length} 条`);
  }

  async function deleteCustomPrompt(id) {
    if (!id) return;
    const item = customPrompts.find((prompt) => prompt.id === id);
    if (!item) return;
    const confirmed = window.confirm(`删除这个 prompt？\n\n${item.title || item.text.slice(0, 40)}`);
    if (!confirmed) return;

    customPrompts = customPrompts.filter((prompt) => prompt.id !== id);
    await persistCustomPrompts();
    prompts = [...customPrompts, ...remotePrompts];
    activeId = prompts[0]?.id || null;
    hydrateLangFilter();
    renderList();
    setStatus(`共 ${prompts.length} 条，我的 ${customPrompts.length} 条`);
    showToast("已删除");
  }

  function showSourceTab(source) {
    const panel = document.querySelector(".gip2-panel");
    if (!panel) return;
    panel.querySelectorAll(".gip2-tab").forEach((tab) => {
      tab.dataset.active = String(tab.dataset.source === source);
    });
  }

  function openManager() {
    chrome.runtime.sendMessage({ type: "gip2-open-manager" }, (response) => {
      if (chrome.runtime.lastError || !response?.ok) {
        showToast("管理页打开失败，请从扩展详情页进入「扩展程序选项」");
      }
    });
  }

  function applyActivePrompt() {
    const item = getActivePrompt();
    if (!item) {
      showToast("请先选择一条提示词");
      return;
    }

    const target = findComposer();
    if (!target) {
      showToast("没有找到 ChatGPT 输入框，请先点击输入区域");
      return;
    }

    insertPrompt(target, item.text);
    showToast("已应用到 ChatGPT 输入框");
  }

  async function copyActivePrompt() {
    const item = getActivePrompt();
    if (!item) {
      showToast("请先选择一条提示词");
      return;
    }
    try {
      await navigator.clipboard.writeText(item.text);
      showToast("已复制提示词");
    } catch {
      showToast("复制失败，请使用应用按钮插入");
    }
  }

  function openActiveSource() {
    const item = getActivePrompt();
    if (!item?.url) {
      window.open("https://github.com/EvoLinkAI/awesome-gpt-image-2-prompts", "_blank", "noopener,noreferrer");
      return;
    }
    window.open(item.url, "_blank", "noopener,noreferrer");
  }

  function findComposer() {
    const selectors = [
      "#prompt-textarea",
      'textarea[data-id="root"]',
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="Ask"]',
      'textarea[placeholder*="发"]',
      'div[contenteditable="true"].ProseMirror',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]',
      "textarea",
    ];

    const visible = selectors
      .flatMap((selector) => [...document.querySelectorAll(selector)])
      .filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 80 && rect.height > 20 && !node.closest(".gip2-panel");
      });

    return visible.at(-1) || document.activeElement;
  }

  function insertPrompt(target, text) {
    target.focus();

    if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
      const setter = Object.getOwnPropertyDescriptor(target.constructor.prototype, "value")?.set;
      if (setter) setter.call(target, text);
      else target.value = text;
      target.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
      target.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }

    if (target.isContentEditable) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(target);
      range.deleteContents();
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand("insertText", false, text);
      target.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
      return;
    }

    navigator.clipboard.writeText(text);
  }

  function setStatus(message) {
    const status = document.querySelector('[data-role="status"]');
    if (status) status.textContent = message;
  }

  function showToast(message) {
    const toast = document.querySelector(".gip2-toast");
    if (!toast) return;
    toast.textContent = message;
    toast.dataset.open = "true";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.dataset.open = "false";
    }, 2600);
  }

  function formatNumber(value) {
    return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(value || 0);
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

  function parseTime(value) {
    if (!value) return 0;
    if (typeof value === "number") return value;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function debounce(fn, wait) {
    let timer = null;
    return () => {
      clearTimeout(timer);
      timer = setTimeout(fn, wait);
    };
  }

  createUi();
  loadPrompts();
})();
