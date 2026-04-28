# Chrome Web Store Listing Draft

## Extension name

GPT Image 2 Prompt Picker

## Short description

在 ChatGPT 网页快速选择、应用和管理 GPT Image 2 提示词。

## Detailed description

GPT Image 2 Prompt Picker 是一个面向 ChatGPT 网页的提示词管理扩展。

主要功能：

- 在 ChatGPT 输入框附近显示 Prompt 按钮。
- 搜索、筛选并一键应用 GPT Image 2 提示词。
- 从多个公开 GitHub 提示词库加载远程 prompt。
- 新增、编辑、删除自己的本地 prompt。
- 支持分类管理、拖拽归类和自动分类。
- 支持修改远程 prompt，并保留本地覆盖版本。
- 支持隐藏或清空远程下载的 prompt。
- 后台静默检查远程库更新并提示。
- 支持导出 prompt 为 JSON、CSV、Markdown 和 TXT。

所有自定义 prompt、分类和本地覆盖数据都保存在浏览器本地存储中。

## Category

Productivity

## Language

Chinese (Simplified)

## Single purpose

在 ChatGPT 网页中提供 GPT Image 2 提示词选择、应用和本地管理能力。

## Permission justification

### storage

用于在浏览器本地保存用户自定义 prompt、分类、远程 prompt 缓存和本地覆盖版本。

### clipboardWrite

用于用户点击「复制」按钮时，将选中的 prompt 写入剪贴板。

### alarms

用于定期静默检查远程提示词库是否有更新。

### tabs

用于从 ChatGPT 页面安全打开扩展的 Prompt 管理页。

### Host permission

`https://raw.githubusercontent.com/EvoLinkAI/awesome-gpt-image-2-prompts/*`

`https://raw.githubusercontent.com/xiaobin1976/GPT_image/*`

用于读取公开的 GPT Image 2 提示词 JSON 和 catalog 数据。

## Data usage

本扩展不收集、不出售、不共享用户数据。

本扩展会在浏览器本地保存：

- 用户新增的 prompt
- prompt 分类
- 本地编辑过的远程 prompt 覆盖版本
- 被隐藏的远程 prompt ID
- 远程库缓存和更新时间状态

这些数据仅保存在 `chrome.storage.local` 中，不会上传到开发者服务器。

## Test instructions

1. 安装扩展。
2. 打开 `https://chatgpt.com/`。
3. 点击输入框附近的 `Prompt` 按钮。
4. 搜索或选择一个 prompt。
5. 点击「应用」，确认 prompt 被写入 ChatGPT 输入框。
6. 点击面板中的管理按钮，打开 Prompt 管理页。
7. 新增一个 prompt，编辑后保存。
8. 将 prompt 拖拽到分类，确认分类生效。
9. 测试导出 JSON 或 Markdown。

不需要测试账号或额外凭据。

## Support URL

https://github.com/sooogooo/gpt-image-2-prompt-picker/issues

## Homepage URL

https://github.com/sooogooo/gpt-image-2-prompt-picker
