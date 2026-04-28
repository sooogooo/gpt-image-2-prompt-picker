# GPT Image 2 Prompt Picker

一个 Chrome MV3 扩展，用于在 ChatGPT 网页直接选择、应用和管理 gpt-image-2 提示词。

默认远程提示词来自：
[`EvoLinkAI/awesome-gpt-image-2-prompts`](https://github.com/EvoLinkAI/awesome-gpt-image-2-prompts)

## 功能

- 在 ChatGPT 输入框附近显示 `Prompt` 按钮。
- 从 GitHub Raw 拉取 `gpt_image2_prompts.json`，并缓存 6 小时。
- 支持搜索、语言筛选、来源筛选、热度/时间/长度排序。
- 支持直接应用到 ChatGPT 输入框、复制、打开来源。
- 支持新增、编辑、删除本地自定义 prompt。
- 自定义 prompt 保存在 Chrome 本地存储里，不会上传。
- 远程数据加载失败时会显示内置兜底样例。

## 安装

1. 打开 Chrome 的 `chrome://extensions/`。
2. 开启右上角「开发者模式」。
3. 点击「加载已解压的扩展程序」。
4. 选择本目录：`E:\codex\image-2`。
5. 打开或刷新 ChatGPT 页面。
6. 点击输入框附近的 `Prompt` 按钮。

## 使用

- `全部`：显示远程库和本地自定义 prompt。
- `我的`：只显示本地自定义 prompt。
- `远程库`：只显示 GitHub 提示词库。
- `+`：新增自定义 prompt。
- 卡片上的编辑按钮：修改本地 prompt。
- 卡片上的删除按钮：删除本地 prompt。
- 单击卡片：选择 prompt 并预览全文。
- 双击卡片：直接应用到 ChatGPT 输入框。
- `应用`：把当前选择的 prompt 填入 ChatGPT 输入框。
- `复制`：复制当前选择的 prompt。
- `刷新`：强制重新从 GitHub 拉取远程库。

## 数据说明

远程提示词数据源：

```text
https://raw.githubusercontent.com/EvoLinkAI/awesome-gpt-image-2-prompts/main/gpt_image2_prompts.json
```

本地自定义 prompt 使用 `chrome.storage.local` 保存，键名为：

```text
gip2CustomPrompts
```
