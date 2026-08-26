# 新文章目录

在浏览器「写文章」页面发布的新文章会以 JSON 文件形式提交到这里
（`build/posts/文章名.json`），格式：

```json
{
  "title": "文章标题",
  "date": "2026-01-01",
  "category": "分类",
  "tags": ["标签1", "标签2"],
  "content": "<p>正文 HTML</p>"
}
```

推送后 GitHub Actions 会自动重新生成站点并部署。
