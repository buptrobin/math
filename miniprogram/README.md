# 函数定义域教练小程序

## 本地打开

1. 打开微信开发者工具。
2. 导入 `miniprogram/` 目录。
3. AppID 可先使用测试号或替换 `project.config.json` 中的 `appid`。
4. 未部署云函数时，本地确定性判题、进度保存、错题复习和重置仍可使用。

## AI 云函数

1. 在微信开发者工具中上传并部署 `cloudfunctions/aiCoach`。
2. 在云函数环境变量中配置 `DEEPSEEK_API_KEY`。
3. 可选配置 `DEEPSEEK_MODEL` 和 `DEEPSEEK_API_ENDPOINT`。
4. 前端不会保存或提交 API Key。

## 云函数自检

部署 `aiCoach` 后，先在云函数测试里使用下面的参数确认云函数本身能被调用：

```json
{
  "mode": "health"
}
```

成功时应返回：

```json
{
  "ok": true,
  "mode": "health",
  "hasDeepSeekApiKey": true,
  "model": "deepseek-chat",
  "endpoint": "https://api.deepseek.com/chat/completions"
}
```

如果 `hasDeepSeekApiKey` 是 `false`，说明 `DEEPSEEK_API_KEY` 没有配置到当前云环境的 `aiCoach` 函数上。

## 验证清单

- 首页能看到课程环节。
- 单选题提交后能显示解析。
- 填空题本地等价答案能判对。
- AI 配置后，填空题本地判错时会尝试 AI 兜底。
- 费曼输出配置 AI 后能返回反馈。
- 重启小程序后本地进度仍存在。
- 点击重置后本地进度清空。
