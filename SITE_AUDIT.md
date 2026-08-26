# shibusama.github.io 网站盘点与清理报告

> 生成时间：本会话
> 站点性质：Hexo + Stellar 主题的**构建产物**（无源码），直接部署于 GitHub Pages

## 执行结果（已完成清理）

用户确认后已执行删除与重建，git 变更：**删除 63 个文件、修改 25 个文件、新增 1 个**。

| 项 | 清理前 | 清理后 |
|---|---|---|
| 文件总数 | 138 | 76 |
| 总体积 | 6.04 MB | 3.88 MB |
| search.json 条目 | 66 | 49（全部对应实际文件） |
| JS 文件 | 24 | 8 |
| 内部链接 | 3332 个无死链 | 1490 个无死链 |

**已删除**：
1. 2013 年全部 14 篇主题示例文章 + 2018/2019 两篇 test 文章
2. 示例分类 `categories/Foo/*`、示例标签 `tags/{Foo,Bar,Baz}`
3. 损坏页 `blog/categories/test/`
4. 占位页 `wiki/stellar/`（3 个文件）
5. 15 个无触发条件的 JS 死代码 + contributors.js（随 stellar 删除失去触发）
6. archives 冗余副本 18 个（全部年份页/分页内容与 archives/index.html 完全相同）

**已重建/修改**：
1. 首页 + 分页：31 篇文章（2012 年 9 篇 + 2002 年 22 篇）重排为 4 页（10/10/10/1），删除 page/5
2. archives/index.html：移除 2019/2018/2013 年份块，保留 2012/2002（31 条）
3. search.json：过滤被删条目，并**修正 wiki 条目路径**（`.html` → 目录形式，此前搜索 wiki 会 404）
4. 全部 14 个 wiki 页面：移除 stellar 板块卡片/侧边栏条目
5. topic/、categories/、tags/ 索引：移除示例条目
6. 2002 诗/topic、2012 官宣后：移除指向被删文章的面包屑/上一篇链接

**遗留注意事项**：
1. `categories/`、`tags/` 为**空壳页**（导航仍引用，删除会导致 107 页导航死链；当前无死链）
2. 友链数据源 `raw.github.xaox.cc/...friends/example.json` 返回 404（按约定未自动换源，友链页可能加载空白）
3. 页面内联脚本的 `ctx.services` 映射仍包含已删脚本路径（按需加载，无对应元素不会请求，不影响功能）

---

## 盘点明细（清理前状态存档）

## 一、总体概况

| 项 | 值 |
|---|---|
| 文件总数 | 138（107 HTML / 24 JS / 4 JPG / 1 SVG / 1 CSS / 1 JSON） |
| 总体积 | 6.04 MB |
| 站点名 | Geist |
| 索引条目（search.json） | 66 条 |
| 内部链接健康度 | 3332 个链接**无死链** |

---

## 二、明确可删（无争议）

### A. 主题自带示例内容（Stellar 主题默认演示文章，非真实内容）
```
2013/12/24/hello-world/        Hello World（Hexo 默认示例）
2013/12/24/long-title/         Lorem ipsum 长标题示例
2013/12/24/中文測試/              中文测试文章
2013/12/24/日本語テスト/            日语测试文章
2013/12/24/categories/         Categories 示例
2013/12/24/tags/               Tags 示例
2013/12/24/elements/           Elements 示例
2013/12/25/excerpts/           Excerpts 示例
2013/12/25/gallery-post/       Gallery Post 示例
2013/12/25/no-title/           无标题示例
2013/12/25/tag-plugins/        Tag Plugins 示例
2013/12/25/诗/topic2/           前奏（示例）
2013/12/25/诗/观念上的革命/         示例
2013/12/26/images/             Images 示例
```

### B. 示例分类 / 标签页（对应上面示例文章的归档残留）
```
categories/Foo/          categories/Foo/Bar/       categories/Foo/Bar/Baz/
tags/Foo/                tags/Bar/                 tags/Baz/
```

### C. 损坏 / 占位页面
```
blog/categories/test/             标题为 "[object Object]"，数据损坏
wiki/stellar/index.html           标题 "这是分页标题"（占位）
wiki/stellar/xxx/index.html       标题 "这是分页标题xxxxxx"（占位）
wiki/stellar/xxxxxxxxxxxxxxx/     标题 "test"（占位）
```

### D. 未使用的 JS 死代码（js/ 下 24 个文件中 15 个无任何加载入口）

按需加载机制：页面内联脚本按 `ds-*` 元素 / 特定选择器是否存在来 `utils.js()` 加载。以下 15 个文件**全站无触发条件**：

```
js/services/mdrender.js               （无 ds-mdrender 元素）
js/services/rating.js                 （无 ds-rating）
js/services/vote.js                   （无 ds-vote）
js/services/sites.js                  （无 ds-sites）
js/services/friends_and_posts.js      （无 ds-friends_and_posts）
js/services/timeline.js               （无 ds-timeline）
js/services/weibo.js                  （无 ds-weibo）
js/services/memos.js                  （无 ds-memos 真实元素）
js/services/twikoo_latest_comment.js  （无 ds-twikoo，未启用评论）
js/services/waline_latest_comment.js  （无 ds-waline，未启用评论）
js/services/artalk_latest_comment.js  （无 ds-artalk，未启用评论）
js/services/giscus_latest_comment.js  （无 ds-giscus，未启用评论）
js/search/algolia-search.js           （搜索配置为 local_search）
js/plugins/voice.js                   （无 .voice>audio 元素）
js/plugins/video.js                   （无 .video>video 元素）
```

**必须保留的 JS**（有实际触发）：`main.js`、`local-search.js`、`siteinfo.js`（107 页有 link-card）、`ghinfo.js`（wiki 30 处）、`contributors.js`（stellar 3 处）、`fcircle.js`（友链 2 处）、`friends.js`（友链 1 处）、`copycode.js`（4 页有代码块）、`download-file.js`（1 页有文件块）。

### E. 失效的外部资源（已实际请求验证）
| URL | 状态 | 说明 |
|---|---|---|
| `raw.github.xaox.cc/.../friends/example.json` | **404** | 友链页 fcircle 组件的数据源，**友链内容可能加载不出** |
| `gcore.jsdelivr.net/gh/cdn-x/emoticons@3.1/...gif` | **404** | 示例文章里的表情图 |
| `via.placeholder.com/350x150.jpg` | **连接失败** | 示例文章占位图（该服务已弃用） |
| `star-vote.xaox.cc` | 404 | rating/vote API 根路径；对应脚本本就是死代码 |

其余 CDN（jsdelivr / unpkg / bootcdn / iconify / siteinfo API 等）均 **200 正常**。

---

## 三、需要你决策的内容

### 1. 带 "test" 的测试文章（2018/2019）
```
2018/07/24/markdown/        "Markdown Style test"
2019/07/25/code-highlight/  "Code Highlight Style test"
```
> 名字带 test，但可能是有意保留的样式演示页，删不删？

### 2. wiki/stellar 目录（3 个文件全是占位标题）
```
wiki/stellar/index.html、wiki/stellar/xxx/、wiki/stellar/xxxxxxxxxxxxxxx/
```
> 看起来是未完成/空壳板块，整个目录删除还是保留？

### 3. 旧年份归档内容（注意：并非全是示例）
- **2002 年（22 篇）**：强迫症福音 5 篇、诗 1 篇、哲学基础 12 篇、文本分析 4 篇 —— **真实内容**
- **2012 年（9 篇）**：文本分析（官宣后/昵称取名/俏皮修辞/dating/梦境备忘录/朋友圈脚本/电影推荐/美学符号/hentai艺术）—— **真实内容**
- 2013 年（14 篇）：全部是示例（见上文 A）
> 你之前勾选过「旧年份老文章」，如果删除 2002/2012，将**清空全部真实文章**，只剩 wiki。确认是否真的要删？

### 4. 冗余分页 / 空壳页
```
page/index.html（标题 "Page"）        —— 首页的分页壳？
archives/page/2..5 等归档分页          —— 删文章后需同步重建
topic/index.html（标题为空 "Geist"）   —— 内容页？
```

### 5. SEO 占位数据（不影响显示，可顺手清理）
- `example.com` 出现 334 次：JSON-LD schema 的 `@id` / `url` 全是占位域名
- `window.canonical.originalHost = null`：域名校验功能实际未配置
- `about/index.html` 等内容页头像是占位符（`xxx.com`、`lipsum` 占位文本等）

---

## 四、保留清单（不动）

- **真实内容**：2002/2012 全部文章、wiki/love 10 篇、wiki/career 1 篇
- **功能页**：首页、关于、归档、分类、标签、友链、朋友文章、探索、收藏、404
- **资源**：assets/ 4 张 JPG + icon.svg、css/main.css、js 保留清单（见上）
- **search.json**：保留（共 66 条，删除文章后需同步重建）

---

## 五、建议的删除顺序（供确认后执行）

1. 删示例与占位：2013 全部 + categories/Foo* + tags/Foo|Bar|Baz + blog/categories/test + wiki/stellar/*
2. 删 JS 死代码：上面 D 清单 15 个文件
3. 删 2018/2019 测试文章（若同意）
4. 修友链数据源（raw.github.xaox.cc 404 → 更换为可用的 fcircle JSON 源，或改静态友链）
5. 清理失效图片引用（blobcat gif、via.placeholder.com）
6. 重建 search.json / 归档分页，确保无死链
7. （可选）清理 example.com 占位 SEO 数据
