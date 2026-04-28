<p align="center">
  <img src="assets/icon128.png" width="96" height="96" alt="GPT Image 2 Prompt Picker logo" />
</p>

# GPT Image 2 Prompt Picker

一个 Chrome MV3 扩展，用于在 ChatGPT 网页直接选择、应用和管理 gpt-image-2 提示词。

默认远程提示词来自：

- [`EvoLinkAI/awesome-gpt-image-2-prompts`](https://github.com/EvoLinkAI/awesome-gpt-image-2-prompts)
- [`xiaobin1976/GPT_image`](https://github.com/xiaobin1976/GPT_image)

## 功能

- 在 ChatGPT 输入框附近显示 `Prompt` 按钮。
- 在 ChatGPT 面板内快速搜索、筛选、应用和复制 prompt。
- 支持多个远程提示词源，目前包含 EvoLinkAI 和 GPT Image Wiki。
- 提供独立 Prompt 管理页，支持新增、编辑、删除、复制为我的 prompt。
- 支持分类管理、拖拽归类、自动分类。
- 支持修改远程下载的 prompt，并保留本地覆盖版本，不被远程更新覆盖。
- 支持隐藏或清空远程下载的 prompt，已修改远程 prompt 会作为本地保护版本保留。
- 后台静默检查远程库更新，有更新时在面板和管理页提示。
- 支持导出当前列表为 JSON、CSV、Markdown、TXT。

## 安装

1. 打开 Chrome 的 `chrome://extensions/`。
2. 开启右上角「开发者模式」。
3. 点击「加载已解压的扩展程序」。
4. 选择本目录。
5. 打开或刷新 ChatGPT 页面。

## 使用入口

- ChatGPT 输入框附近的 `Prompt` 按钮：快速选择和应用 prompt。
- ChatGPT 面板顶部的管理按钮：打开完整 Prompt 管理页。
- Chrome 扩展详情页的「扩展程序选项」：打开完整 Prompt 管理页。
- 快捷键：`Alt+Shift+P` 打开 Prompt 管理页。

## Prompt 管理

- 左侧分类区可新增、重命名、删除分类。
- 将 prompt 卡片拖拽到左侧分类上即可归类。
- `自动分类` 会根据分类关键词和 prompt 内容匹配分类。
- 编辑远程 prompt 时，不会直接改远程数据，而是保存本地覆盖版本。
- 删除远程 prompt 时，会在本地隐藏该条远程数据。
- `清空远程下载` 会清除远程缓存并隐藏当前远程 prompt，已编辑的远程 prompt 会保留本地版本。

## 导出

管理页支持导出当前筛选结果：

- JSON
- CSV
- Markdown
- TXT

## 数据说明

远程提示词数据源：

```text
https://raw.githubusercontent.com/EvoLinkAI/awesome-gpt-image-2-prompts/main/gpt_image2_prompts.json
https://raw.githubusercontent.com/xiaobin1976/GPT_image/main/site/library/catalog.json
```

本地数据使用 `chrome.storage.local` 保存，主要键名：

```text
gip2CustomPrompts
gip2Categories
gip2RemoteOverrides
gip2HiddenRemoteIds
gip2RemoteUpdate
```
