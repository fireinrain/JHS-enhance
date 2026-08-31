# JHS-enhance

> Jav-鉴黄师 油猴脚本 — 工程化重构版本

基于 `vite-plugin-monkey` 脚手架，将原 10,000+ 行单体脚本拆分为 56 个可维护的 ES Module 模块，支持本地开发热更新、一键构建。

---

## 安装

> 请先确保浏览器已安装 [Tampermonkey](https://www.tampermonkey.net/) 扩展。

### 一键安装

[![Install](https://img.shields.io/badge/点击安装-JHS--enhance.user.js-brightgreen)](https://github.com/fireinrain/JHS-enhance/releases/latest/download/jhs-enhance.user.js)

> 点击上方按钮，Tampermonkey 会自动弹出安装提示。安装后脚本会自动更新（Tampermonkey 默认每天检查一次更新）。

### 手动安装

1. 从 [Releases](https://github.com/fireinrain/JHS-enhance/releases) 页面下载最新 `jhs-enhance.user.js`
2. 打开 Tampermonkey 管理面板 → 拖入文件安装

---

## 功能概览

### 列表页增强

- 作品状态标签（屏蔽/收藏/已下载/已观看）
- 一键筛选已收藏/新作品/待鉴定
- 演员黑名单过滤、标题关键词过滤
- 封面快捷按钮（长缩略图/预览视频/鉴定按钮/第三方跳转/复制番号）
- 分类折叠、热榜 Top250、免 VIP 查看热播
- 自动翻页

### 详情页增强

- **磁力搜索聚合（MagnetHub）**：多引擎聚合搜索（Sukebei / U9A9 / U3C3 / BTSearch / SoKitty / ØMagnet），Tab
  切换引擎，结果表格展示（名称/大小/日期/操作），支持按大小/最新/最旧排序，质量标签自动识别（中字/4K/破解），一键复制磁力链接（含番号提取码），验车功能（Whatslink
  API 截图预览、键盘/缩放导航），115 离线下载快捷按钮
- **磁力排序与过滤（JavDB）**：按发布日期/文件大小/文件数量拖拽排序，勾选启用；高清/4K/字幕/无码多条件并集过滤，4K 磁力行高亮显示
- 磁力链接高亮匹配已收藏/已下载状态
- DMM 多画质预览视频
- **多源视频预览**：Javxy 聚合 API 独立按钮（番号/识别码右侧），多源 fallback（JavTrailers / JavDB 等），HLS 支持、播放进度记忆、画质切换
- **标题翻译**：Google 翻译，支持开关多次切换不失效
- **字幕搜索**：合并迅雷 + SubTitleCat 为单一入口，支持 115 网盘直传、详情页预匹配目录、多目录选择上传、长目录名截断展示、字幕预览绿色字体
- **多源预览图**：javfree / projectjav / javstore 三源切换，来源按钮绿色高亮，sessionStorage 缓存，错误提示弹窗内显示
- 演员信息展示、相关清单、评论查看
- 以图识图、第三方站点跳转

### 115 网盘集成

- **番号智能匹配**：双阶段搜索策略 — 第一阶段精准搜索（完整番号 + `type:4`），未命中时第二阶段模糊兜底（尾号 +
  正则匹配），支持不规则文件名（如 `MIVR00345-5.mp4`、`ABP001.mp4`）
- **磁力离线下载**：MagnetHub 磁力搜索结果支持一键添加至 115 离线下载
- **不规则文件名自动重命名**
  ：检测到需第二阶段才能匹配的作品时，自动将文件重命名为标准番号格式（如 `mdvr00317-3.mp4` → `MDVR-317-3.mp4`
  ），设置面板可开关 + 选择范围（仅VR / 全部）
- 作品目录匹配与详情页预加载
- 多目录选择上传字幕
- 字幕一键直传至匹配目录
- **作品删除增强**：删除整个文件夹（非仅视频），支持标记删除批量操作，删除后字幕目录列表联动；批量删除含风控保护（1~3s
  随机延迟 + 触发风控自动重试退避）；删除安全检查使用 `codeParse` 正则匹配番号

### 数据管理

- IndexedDB 本地存储
- 云盘备份/恢复（阿里云盘 / WebDAV）
- 跨 Tab 数据同步（BroadcastChannel）

### 自动化任务

- 新作品检测
- 收藏演员同步
- 黑名单自动检测与更新
- 后台定时任务调度

### 其他

- FC2 站点支持（含 123AV 补全）
- **MagnetHub 磁力搜索**：6 引擎聚合（Sukebei/U9A9/U3C3/BTSearch/SoKitty/ØMagnet），质量标签（中字/4K/破解），验车截图预览（Whatslink
  API，键盘导航），排序切换，115 离线一键下载
- JavTrailers 站点处理
- 设置面板：快捷键配置、域名配置、缓存清理、标记删除列表、打赏作者（二维码/钱包地址可自定义）
- 浏览历史、想看/已看列表
- 多站点支持：JavDB / JavBus / JavSee / SeeJav / FC2 / JavTrailers / SubTitleCat

---

## 想法与交流
兄弟们还有其他的想法或问题，欢迎在 issue 中讨论。

## 项目结构

```
JHS-enhance/
├── src/
│   ├── main.js                  # 入口文件：全局初始化、插件注册、页面启动、loading/Toast/Viewer 全局函数
│   ├── core/                    # 基础设施层（7 个模块）
│   │   ├── constants.js         # 全局常量、CSS 样式、页面类型判断、枚举值
│   │   ├── base-plugin.js       # 插件基类（含 SVG 图标、页面信息解析、getBean 跨插件调用）
│   │   ├── plugin-manager.js    # 插件管理器（注册、CSS 注入、插件生命周期、按站点分组）
│   │   ├── globals.js           # 全局依赖挂载（jQuery、localforage、layer 等）
│   │   ├── storage.js           # IndexedDB 存储管理器（localforage 封装，含缓存）
│   │   ├── utils.js             # 工具函数集（DOM 操作、弹窗确认、快捷键、重试、日期格式化）
│   │   └── gmHttp.js            # GM_xmlhttpRequest 封装（GET/POST/Form/File、超时重试、分块下载）
│   ├── api/                     # API 层（4 个模块）
│   │   ├── javdb.js             # JavDB API 封装（签名算法、搜索、评论、磁力列表）
│   │   ├── dmm.js               # DMM 预览视频获取（多画质、默认画质选择）
│   │   ├── dmm-graphql.js       # DMM GraphQL API（备选视频源回退）
│   │   └── javxy.js             # Javxy 聚合视频 API（多源解析、签名生成）
│   ├── lib/                     # 第三方补丁库
│   │   ├── gm-xhr-parallel.js   # Tampermonkey MV3 并行请求修复（redirect: manual）
│   │   └── hls-runtime.js       # HLS 视频播放运行时（hls.js 封装、进度记忆、画质切换）
│   └── plugins/                 # 插件层（42 个功能插件）
│       ├── list-page.js         # 列表页过滤与状态标签渲染
│       ├── list-page-button.js  # 列表页功能按钮（待鉴定/已收藏/新作品/黑名单管理）
│       ├── detail-page.js       # 详情页数据加载与基础增强
│       ├── detail-page-button.js# 详情页操作按钮（115 目录预加载 + 磁力排序过滤面板）
│       ├── setting.js           # 设置面板（Tab 页：基础/任务/域名/快捷键/屏蔽/缓存/标记删除/打赏作者；含 115 自动重命名开关 + 范围选择）
│       ├── translate.js         # 标题翻译（Google 翻译 API，原始标题缓存）
│       ├── preview-video.js     # DMM 预览视频播放器
│       ├── highlight-magnet.js  # 磁力链接高亮 + 排序 + 过滤（多键排序、并集过滤、4K 高亮）
│       ├── auto-page.js         # 自动翻页
│       ├── blacklist.js         # 黑名单管理（屏蔽演员/番号/关键词）
│       ├── favorite-actresses.js# 收藏演员同步与高亮
│       ├── new-video.js         # 新作品检测与通知
│       ├── task.js              # 后台任务调度（黑名单/收藏演员/新作品定时执行）
│       ├── history.js           # 浏览历史表格
│       ├── wangpan-115.js       # 115 网盘匹配/标签/删除（含 codeParse 正则匹配、双阶段搜索、自动重命名）
│       ├── wangpan-115-task.js  # 115 网盘任务处理（文件搜索 API 封装）
│       ├── aliyun-pan.js        # 阿里云盘备份/恢复
│       ├── fc2.js               # FC2 页面处理
│       ├── fc2-by123av.js       # FC2 通过 123AV 补全番号信息
│       ├── actress-info.js      # 演员信息展示（含头像、生日、三围等）
│       ├── related.js           # 相关作品清单
│       ├── review.js            # 评论区展示
│       ├── cover-button.js      # 封面快捷按钮（SVG 图标 + 5 种封面操作）
│       ├── fold-category.js     # 分类折叠展开
│       ├── hit-show.js          # 热播榜单 + 免 VIP 查看
│       ├── top250.js            # Top250 排行榜
│       ├── nav-bar.js           # JavDB 导航栏增强
│       ├── bus-nav-bar.js       # JavBus 导航栏增强
│       ├── bus-detail-page.js   # JavBus 详情页专属处理
│       ├── bus-img.js           # JavBus 图片处理
│       ├── bus-preview-video.js # JavBus 预览视频
│       ├── image-recognition.js # 以图识图（第三方识图接口）
│       ├── screenshot.js        # 多源预览图（javfree/projectjav/javstore + 来源切换弹窗）
│       ├── subtitles.js         # 字幕搜索（整合迅雷+SubTitleCat）+ 115 多目录直传
│       ├── req115.js            # 115 网盘 API 封装（Req 基类 + Drive115 + Req115）
│       ├── magnet-hub.js        # MagnetHub 磁力搜索（6 引擎聚合、质量标签、验车截图、115 离线）
│       ├── other-site.js        # 第三方站点跳转链接
│       ├── jav-trailers.js      # JavTrailers 站点处理
│       ├── javxy-preview-video.js# Javxy 多源视频预览（独立按钮、聚合 API、HLS 支持）
│       ├── subtitle-cat.js      # SubTitleCat 字幕搜索（已整合，保留原文件）
│       ├── filter-title-keyword.js # 标题关键词过滤
│       └── want-watched.js      # 想看/已看视频列表
├── vite.config.mjs              # Vite + vite-plugin-monkey 配置（元数据/CDN 依赖/域名匹配）
├── package.json
└── JHS-origin.js                # 原始单体脚本（参考归档）
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

## 赞助

如果当前项目有帮到您的话，赞助我喝瓶水/Star项目也是极好的,感谢支持 :)

![赞助](https://i.imgur.com/ynGK6he.jpeg)

## 构建配置

`vite-plugin-monkey` 在 `vite.config.mjs` 中配置了：

- **match/include**：脚本匹配的 URL 模式
- **require**：CDN 外部依赖（jQuery、Tabulator 等）
- **connect**：GM_xmlhttpRequest 允许的跨域域名
- **grant**：GM_* API 权限声明

---

## 版本历史

- **v3.3.9**
  - 新增：115 番号智能匹配 — `codeParse` 正则匹配引擎，双阶段搜索策略（精准 →
    模糊兜底），支持不规则文件名（如 `MIVR00345-5.mp4`、`ABP001.mp4`）
  - 新增：115 不规则文件名自动重命名 —
    检测到需模糊匹配的作品时自动批量重命名为标准格式（如 `mdvr00317-3.mp4` → `MDVR-317-3.mp4`），设置面板可开关 +
    范围选择（仅VR / 全部）
  - 优化：删除安全检查改用 `codeParse` 正则匹配，消除 `includes` 方式对不规则文件名的误判
  - 优化：`searchFiles` 增加 `type:4` 参数，搜索仅返回视频文件，避免目录占用 30 条槽位

- **v3.3.8**
  - 新增：Javxy 多源视频预览独立按钮（番号/识别码右侧），基于 Javxy 聚合 API，支持 JavTrailers / JavDB 等多源回退
  - 新增：HLS 视频播放运行时（hls.js 封装），支持 .m3u8 格式、播放进度记忆、画质切换
  - 新增：DMM GraphQL API 模块，作为备选视频源回退方案
  - 优化：`bus-preview-video.js` 和 `preview-video.js` 清理移植代码，保持原有播放逻辑不变
  - 优化：`dmm.js` 回退至仅 DMM Affiliate API + GraphQL API 双通道，移除 Javxy 耦合

- **v3.3.7**
  - 新增：JavDB 磁力排序与过滤（拖拽排序、多条件并集过滤、4K 高亮）
  - 新增：多源预览图（javfree/projectjav/javstore + 来源切换弹窗 + 绿色高亮）
  - 新增：字幕搜索合并为单一入口（迅雷+SubTitleCat），详情页预匹配 115 目录，多目录选择上传
  - 新增：标记删除批量 115 删除（含风控保护：1~3s 随机延迟 + 风控自动退避重试）
  - 优化：作品删除改为删除整个文件夹（非仅视频），删除后字幕目录列表联动更新
  - 修复：标题翻译开关多次切换后失效（原始标题 data-original-title 缓存）
  - 修复：115 目录名过长截断展示（最多 26 字符）
  - 修复：字幕预览区域字体改为绿色
  - 修复：JavBus/JavDB 磁力列表 DOM 精确提取（data-rank/data-size/data-files/data-date 属性）
  - 修复：无码过滤条件新增 -U/-UC/-u/-uc 匹配
  - 优化：删除作品 115 风控提示（标记删除面板）
  - 优化：设置面板打赏作者二维码/钱包地址可自定义

- **v3.3.6** — 工程化重构版本，模块化拆分（41 个插件），支持 Vite HMR 开发热更新

---

## License

MIT