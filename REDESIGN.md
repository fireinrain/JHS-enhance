好的，让我先全面分析这个 11000 行的脚本。我会分段读取，理解它的整体结构和功能模块。




The user wants me to analyze the JHS-origin.js file (about 11,000 lines) and provide a detailed report on how to modularize it. Let me first read through the entire file to understand its structure, then provide a comprehensive refactoring plan.

Since the file is 10,962 lines, I need to read it in chunks. Let me start by reading several sections to understand the code structure.

Let me read the file in multiple chunks to understand:
1. The beginning (already read some)
2. Key sections throughout
3. The end

I'll read multiple sections in parallel.

Let me continue reading more sections to get a complete picture of the codebase.

Let me also read the end of the file to see the initialization/entry point.

Now I have a very comprehensive understanding of the codebase. Let me also read the very end to see the initialization.

Now I have a comprehensive understanding of the entire codebase. Let me write a detailed analysis report.

The code is approximately 10,962 lines, with a well-defined plugin architecture:
- PluginManager: manages plugins
- BasePlugin: base class for all plugins
- ~40 plugins extending BasePlugin

The code also contains:
- Utility classes (Utils, gmHttp, StorageManager, show, clog, etc.)
- CSS styles
- Constants and configuration
- API interfaces (JavDbApi, etc.)
- A plugin system with registration and execution

Let me now write a comprehensive refactoring report.
现在我已经完整分析了整个代码库。以下是详细的结构分析报告：

---

## 🔍 JHS-enhance 代码结构分析报告

### 📊 总体概况

| 指标 | 数据 |
|------|------|
| 总行数 | **10,962 行** |
| 核心类/插件 | **40+ 个** |
| 支持站点 | JavDB、JavBus、JavTrailers、SubTitleCat、阿里云盘、115网盘 |
| 外部依赖 | jQuery、Tabulator、layui-layer、MD5、Toastify、localForage、ViewerJS、QRCodeJS |

---

### 🏗️ 现有架构

代码已经有一个**不错的插件架构**，只是全部写在一个文件里：

```
入口（最后100行）
  ├── 初始化 pluginManager
  ├── 检测当前页面类型（isDetailPage / isListPage / isFc2Page）
  ├── 按站点注册插件
  ├── pluginManager.processCss()  → 加载所有插件CSS
  └── pluginManager.processPlugins() → 执行所有插件
```

插件基类 `BasePlugin` 提供了：
- `getName()` — 插件名
- `initCss()` — 返回CSS字符串
- `handle()` — 主逻辑入口
- `getPageInfo()` — 获取当前页面信息
- `getBean(name)` — 获取其他插件实例

---

### 📦 代码功能模块划分

我将 11000 行代码按功能分为以下 **8 大模块**，建议拆分为独立文件：

---

#### 模块一：🛠️ 基础设施层（~1500 行）
**建议目录：`src/core/`**

| 文件 | 内容 | 说明 |
|------|------|------|
| `utils.js` | `Utils` 类（~300行） | 通用工具函数：下载、滚动、剪贴板、URL解析、排序等 |
| `gmHttp.js` | `gmHttp` 类（~200行） | 基于 `GM_xmlhttpRequest` 的 HTTP 封装 |
| `storage.js` | `StorageManager` 类（~500行） | IndexedDB 存储管理：收藏、屏蔽、设置、演员等 |
| `show.js` | `show` / `clog` 对象（~100行） | Toast 消息提示、控制台日志 |
| `constants.js` | 所有常量（~200行） | 状态枚举、画质选项、翻译映射表、标签样式等 |
| `styles.js` | CSS 样式（~300行） | JavDB/JavBus 站点样式、全局样式、滚动条样式 |

---

#### 模块二：🔌 插件系统（~200 行）
**建议目录：`src/core/`**

| 文件 | 内容 | 说明 |
|------|------|------|
| `plugin-manager.js` | `PluginManager` 类 | 插件注册、CSS加载、插件执行 |
| `base-plugin.js` | `BasePlugin` 类 | 插件基类，提供 `getName()`、`handle()`、`initCss()` 等 |

---

#### 模块三：🌐 API 接口层（~200 行）
**建议目录：`src/api/`**

| 文件 | 内容 | 说明 |
|------|------|------|
| `javdb-api.js` | `javDbApi` 对象 | JavDB API：获取评论、搜索电影、电影详情、磁力链接 |

---

#### 模块四：📋 列表页插件（~2500 行）
**建议目录：`src/plugins/list/`**

| 文件 | 类名 | 功能 |
|------|------|------|
| `list-page.js` | `ListPagePlugin` | 列表页核心：状态标签渲染、屏蔽过滤、演员屏蔽、排序 |
| `list-page-button.js` | `ListPageButtonPlugin` | 列表页工具栏按钮：一键屏蔽、收藏、随机打开等 |
| `auto-page.js` | `AutoPagePlugin` | 自动翻页 |
| `fold-category.js` | `FoldCategoryPlugin` | 折叠/展开分类标签区域 |
| `cover-button.js` | `CoverButtonPlugin` | 封面图上的操作按钮（屏蔽、收藏等） |
| `history.js` | `HistoryPlugin` | 鉴定记录面板 |
| `filter-title-keyword.js` | `FilterTitleKeywordPlugin` | 标题关键词屏蔽 |
| `blacklist.js` | `BlacklistPlugin` | 黑名单管理（屏蔽演员/标签） |
| `hit-show.js` | `HitShowPlugin` | 热播榜 |
| `top250.js` | `TOP250Plugin` | TOP250 排行榜 |

---

#### 模块五：🎬 详情页插件（~2000 行）
**建议目录：`src/plugins/detail/`**

| 文件 | 类名 | 功能 |
|------|------|------|
| `detail-page.js` | `DetailPagePlugin` | 详情页核心：FC2/普通影片信息展示 |
| `detail-page-button.js` | `DetailPageButtonPlugin` | 详情页按钮：屏蔽、收藏、已下载、已观看、磁力搜索、字幕 |
| `bus-detail-page.js` | `BusDetailPagePlugin` | JavBus 详情页 |
| `review.js` | `ReviewPlugin` | 评论查看 |
| `related.js` | `RelatedPlugin` | 相关清单 |
| `highlight-magnet.js` | `HighlightMagnetPlugin` | 磁力链接高亮过滤 |
| `translate.js` | `TranslatePlugin` | 标题翻译（日→中） |
| `want-watched.js` | `WantAndWatchedVideosPlugin` | 想看/已看视频 |

---

#### 模块六：🎥 视频与媒体插件（~1500 行）
**建议目录：`src/plugins/media/`**

| 文件 | 类名 | 功能 |
|------|------|------|
| `preview-video.js` | `PreviewVideoPlugin` | JavDB 预览视频播放 |
| `bus-preview-video.js` | `BusPreviewVideoPlugin` | JavBus 预览视频播放 |
| `screen-shot.js` | `ScreenShotPlugin` | 缩略图加载 |
| `bus-img.js` | `BusImgPlugin` | JavBus 图片处理 |
| `image-recognition.js` | `ImageRecognitionPlugin` | 以图识图 |

---

#### 模块七：🔗 外部站点与工具插件（~2000 行）
**建议目录：`src/plugins/external/`**

| 文件 | 类名 | 功能 |
|------|------|------|
| `magnet-hub.js` | `MagnetHubPlugin` | 多站点磁力搜索聚合 |
| `other-site.js` | `OtherSitePlugin` | 其他站点入口（JavStore、MissAV等） |
| `fc2.js` | `Fc2Plugin` | FC2 影片页面 |
| `fc2-123av.js` | `Fc2By123AvPlugin` | 123AV 的 FC2 页面 |
| `wangpan-115.js` | `WangPan115Plugin` / `WangPan115TaskPlugin` / `WangPan115MatchPlugin` | 115网盘离线下载 |
| `aliyun-pan.js` | `AliyunPanPlugin` | 阿里云盘 |
| `jav-trailers.js` | `JavTrailersPlugin` | JavTrailers 站点 |
| `subtitle-cat.js` | `SubTitleCatPlugin` | SubTitleCat 字幕搜索 |

---

#### 模块八：👤 演员与任务插件（~2000 行）
**建议目录：`src/plugins/actress/`**

| 文件 | 类名 | 功能 |
|------|------|------|
| `actress-info.js` | `ActressInfoPlugin` | 演员信息面板 |
| `favorite-actresses.js` | `FavoriteActressesPlugin` | 收藏演员管理 |
| `new-video.js` | `NewVideoPlugin` | 新作品检测 |
| `task.js` | `TaskPlugin` | 定时任务：检测黑名单、同步演员、新作品检测 |
| `nav-bar.js` | `NavBarPlugin` / `BusNavBarPlugin` | 导航栏增强 |
| `setting.js` | `SettingPlugin` | 设置面板 |

---

### 🎯 建议的项目目录结构

```
JHS-enhance/
├── src/
│   ├── main.js                    # 入口：初始化 + 插件注册
│   ├── core/
│   │   ├── utils.js               # 通用工具函数
│   │   ├── gmHttp.js              # GM_xmlhttpRequest 封装
│   │   ├── storage.js             # IndexedDB 存储管理
│   │   ├── show.js                # Toast 消息提示
│   │   ├── constants.js           # 所有常量
│   │   ├── styles.js              # CSS 样式
│   │   ├── plugin-manager.js      # 插件管理器
│   │   └── base-plugin.js         # 插件基类
│   ├── api/
│   │   └── javdb-api.js           # JavDB API 接口
│   ├── plugins/
│   │   ├── list/                  # 列表页插件 (10个)
│   │   ├── detail/                # 详情页插件 (8个)
│   │   ├── media/                 # 视频/媒体插件 (5个)
│   │   ├── external/              # 外部站点插件 (8个)
│   │   └── actress/               # 演员/任务插件 (6个)
│   └── styles/
│       └── ... (可选，如果CSS拆出来)
├── vite.config.mjs
├── package.json
└── JHS-origin.js                  # 保留原始文件作为参考
```

---

### ⚠️ 拆分时的注意事项

1. **全局变量依赖**：当前代码大量使用 `unsafeWindow.xxx = window.xxx`，拆分为 ES Module 后需要改为 `export`/`import`，同时通过 `window` 暴露给油猴全局作用域

2. **插件间依赖**：插件通过 `this.getBean(name)` 互相调用，拆分后需确保 `PluginManager` 先初始化

3. **CDN 外部依赖**：jQuery、Tabulator 等通过 `@require` 加载，在模块中直接使用 `$`、`Tabulator` 等全局变量即可

4. **CSS 注入**：`insertStyle()` 和 `initCss()` 需要 `document.head` 可用后才能执行

5. **循环依赖**：注意 `TaskPlugin` ↔ `BlacklistPlugin`、`ListPagePlugin` ↔ `BlacklistPlugin` 等之间的双向引用

---

### 🚀 建议的实施顺序

| 优先级 | 步骤 | 预计工作量 |
|--------|------|-----------|
| P0 | 拆分 `core/` 基础设施（utils, gmHttp, storage, show, constants, styles） | 1-2小时 |
| P1 | 拆分插件系统（plugin-manager, base-plugin）和入口 `main.js` | 30分钟 |
| P2 | 拆分 API 层（javdb-api） | 15分钟 |
| P3 | 分批拆分插件，每批 3-5 个，逐个验证构建 | 3-5小时 |
| P4 | 清理全局变量，统一为 ES Module 导入导出 | 1小时 |

---

需要我开始执行拆分吗？建议从 **P0（基础设施层）** 开始，这是最独立、最不容易出错的模块。