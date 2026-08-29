# JHS-enhance

> Jav-鉴黄师 油猴脚本 — 工程化重构版本

基于 `vite-plugin-monkey` 脚手架，将原 10,000+ 行单体脚本拆分为 49 个可维护的 ES Module 模块，支持本地开发热更新、一键构建。

---

## 功能概览

- **列表页增强**：作品状态标签（屏蔽/收藏/已下载/已观看）、一键打开待鉴定/已收藏作品、新作品检测、演员黑名单过滤
- **详情页增强**：磁力链接高亮、预览视频（DMM 多画质）、标题翻译、字幕搜索（SubTitleCat / 迅雷）、演员信息、相关清单
- **数据管理**：IndexedDB 本地存储、云盘备份/恢复（阿里云盘 / 115 网盘 / WebDAV）、跨 Tab 数据同步
- **自动化任务**：自动翻页、新作品检测、收藏演员同步、黑名单更新
- **UI 优化**：分类折叠、热榜 Top250、免 VIP 查看热播、以图识图、截图功能
- **多站点支持**：JavDB / JavBus / JavSee / SeeJav / FC2 / JavTrailers / SubTitleCat

---

## 想法与交流
兄弟们还有其他的想法或问题，欢迎在 issue 中讨论。

## 项目结构

```
JHS-enhance/
├── src/
│   ├── main.js                  # 入口文件：全局初始化、插件注册、页面启动
│   ├── core/                    # 基础设施层
│   │   ├── constants.js         # 全局常量、CSS 样式、页面类型判断
│   │   ├── base-plugin.js       # 插件基类（含 SVG 图标、页面信息解析）
│   │   ├── plugin-manager.js    # 插件管理器（注册、CSS/插件生命周期）
│   │   ├── globals.js           # 全局依赖挂载（jQuery、localforage 等）
│   │   ├── storage.js           # IndexedDB 存储管理器（localforage 封装）
│   │   ├── utils.js             # 工具函数集（DOM 操作、弹窗、快捷键等）
│   │   └── gmHttp.js            # GM_xmlhttpRequest 封装（带重试/并发控制）
│   ├── api/                     # API 层
│   │   ├── javdb.js             # JavDB API 封装（签名、搜索、评论等）
│   │   └── dmm.js               # DMM 预览视频获取（多画质）
│   └── plugins/                 # 插件层（38 个功能插件）
│       ├── list-page.js         # 列表页过滤与状态标签
│       ├── list-page-button.js  # 列表页功能按钮（待鉴定/已收藏/新作品/黑名单）
│       ├── detail-page.js       # 详情页数据加载
│       ├── detail-page-button.js# 详情页操作按钮
│       ├── setting.js           # 设置面板（Tabulator 表格）
│       ├── translate.js         # 标题翻译（Google 翻译 API）
│       ├── preview-video.js     # DMM 预览视频
│       ├── highlight-magnet.js  # 磁力链接高亮匹配
│       ├── auto-page.js         # 自动翻页 / 云盘备份
│       ├── blacklist.js         # 黑名单管理（演员/番号）
│       ├── favorite-actresses.js# 收藏演员同步
│       ├── new-video.js         # 新作品检测
│       ├── task.js              # 后台任务调度
│       ├── history.js           # 浏览历史
│       ├── wangpan-115.js       # 115 网盘匹配
│       ├── wangpan-115-task.js  # 115 网盘任务处理
│       ├── aliyun-pan.js        # 阿里云盘
│       ├── fc2.js               # FC2 页面处理
│       ├── fc2-by123av.js       # FC2 通过 123AV 搜索
│       ├── actress-info.js      # 演员信息展示
│       ├── related.js           # 相关清单
│       ├── review.js            # 评论展示
│       ├── cover-button.js      # 封面按钮
│       ├── fold-category.js     # 分类折叠
│       ├── hit-show.js          # 热播榜单
│       ├── top250.js            # Top250 排行榜
│       ├── nav-bar.js           # JavDB 导航栏增强
│       ├── bus-nav-bar.js       # JavBus 导航栏增强
│       ├── bus-detail-page.js   # JavBus 详情页
│       ├── bus-img.js           # JavBus 图片处理
│       ├── bus-preview-video.js # JavBus 预览视频
│       ├── image-recognition.js # 以图识图
│       ├── screenshot.js        # 截图功能
│       ├── magnet-hub.js        # MagnetHub 磁力搜索
│       ├── other-site.js        # 第三方站点链接
│       ├── jav-trailers.js      # JavTrailers 站点
│       ├── subtitle-cat.js      # SubTitleCat 字幕搜索
│       ├── filter-title-keyword.js # 标题关键词过滤
│       └── want-watched.js      # 想看/已看视频列表
├── vite.config.mjs              # Vite + vite-plugin-monkey 配置
├── package.json
└── JHS-origin.js                # 原始单体脚本（参考）
```

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 构建工具 | Vite 6 + vite-plugin-monkey 5 |
| 模块系统 | ES Module |
| DOM 操作 | jQuery 3.7 |
| 数据存储 | localforage (IndexedDB) |
| 表格组件 | Tabulator 6 |
| 弹窗组件 | layui-layer |
| Toast 通知 | Toastify |
| 图片查看 | ViewerJS |
| 二维码 | QRCodeJS |
| 哈希 | blueimp-md5 |
| 代码风格 | 纯 JavaScript（无 TypeScript） |

---

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

启动后会在终端输出一个本地代理服务器地址，将该地址填入 Tampermonkey 即可实现热更新开发。

### 生产构建

```bash
npm run build
```

构建产物输出到 `dist/jhs-enhance.user.js`，可直接安装到 Tampermonkey。

---

## 架构设计

### 三层架构

```
main.js (入口)
    │
    ├── core/       基础设施层
    │   ├── 全局常量、CSS 样式
    │   ├── 插件基类、插件管理器
    │   ├── 存储、网络、工具函数
    │   └── 全局依赖挂载
    │
    ├── api/        API 层
    │   ├── JavDB API（签名、搜索）
    │   └── DMM 视频 API
    │
    └── plugins/    插件层
        ├── 列表页插件（按站点分）
        ├── 详情页插件（按站点分）
        ├── 功能插件（翻译/黑名单/备份等）
        └── 第三方站点插件
```

### 插件机制

每个插件继承 `BasePlugin`，实现以下生命周期方法：

- `getName()` — 返回插件唯一标识
- `initCss()` — 返回插件专属 CSS（可选）
- `handle()` — 插件主逻辑

插件通过 `PluginManager` 统一注册和管理，按站点类型（JavDB / JavBus）分两组注册，确保不同站点加载正确的插件。

### 页面类型判断

```
isDetailPage → 作品详情页
isListPage   → 作品列表页
isFc2Page    → FC2 搜索结果页
isSearchPage → 搜索页
```

插件在 `handle()` 中通过 `window.isDetailPage` 等全局变量判断当前页面类型，决定是否执行逻辑。

---

## 开发指南

### 添加新插件

1. 在 `src/plugins/` 下创建 `my-plugin.js`
2. 继承 `BasePlugin`，实现 `getName()` 和 `handle()`
3. 在 `src/main.js` 中 import 并注册：

```javascript
import { MyPlugin } from './plugins/my-plugin.js';
// 在对应站点分支中注册
pluginManager.register(MyPlugin);
```

### 访问全局服务

插件中可通过以下方式访问全局服务：

```javascript
await storageManager.getSetting('key');       // 存储
await storageManager.getCarList();             // 车辆列表
this.getBean('OtherPluginName');               // 获取其他插件实例
window.utils.q(event, '确认?', callback);      // 确认弹窗
window.show.ok('操作成功');                     // Toast 通知
```

### 样式注入

- **全局样式**：定义在 `core/constants.js` 的 `mainCss` 中，启动时自动注入
- **站点样式**：`javBusStyle` / `javdbStyle` 按站点条件注入
- **插件样式**：通过 `initCss()` 方法返回，由 PluginManager 统一注入

---

## 构建配置

`vite-plugin-monkey` 在 `vite.config.mjs` 中配置了：

- **match/include**：脚本匹配的 URL 模式
- **require**：CDN 外部依赖（jQuery、Tabulator 等）
- **connect**：GM_xmlhttpRequest 允许的跨域域名
- **grant**：GM_* API 权限声明

---

## 版本历史

- **v3.3.6** — 工程化重构版本，模块化拆分，支持 HMR 开发

---

## License

MIT