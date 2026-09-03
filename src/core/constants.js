var __defProp = Object.defineProperty,
  __typeError = (msg) => {
    throw TypeError(msg);
  },
  __publicField = (obj, key, value) =>
    ((obj, key, value) =>
      key in obj
        ? __defProp(obj, key, {
            enumerable: !0,
            configurable: !0,
            writable: !0,
            value: value,
          })
        : (obj[key] = value))(obj, "symbol" != typeof key ? key + "" : key, value),
  __privateMethod = (obj, member, method) => (
    ((obj, member, msg) => {
      member.has(obj) || __typeError("Cannot " + msg);
    })(obj, member, "access private method"),
    method
  );

const currentHref = window.location.href,
  isJavDb = currentHref.includes("javdb"),
  isJavBus = currentHref.includes("javbus") || currentHref.includes("seejav") || currentHref.includes("bus") || currentHref.includes("javsee") || "javbus" === (() => { try { const _alt = $(".hidden-xs").attr("alt"); return _alt ? _alt.trim().toLowerCase() : void 0; } catch (_e) { return void 0; } })(),
  isSearchPage = currentHref.includes("/search?q") || currentHref.includes("/search/") || currentHref.includes("/users/"),
  Status_RUNNING = "RUNNING",
  Status_SUCCESS = "SUCCESS",
  Status_FAIL = "FAIL",
  Status_LOADING = "LOADING",
  Status_FILTER = "filter",
  Status_FAVORITE = "favorite",
  Status_HAS_DOWN = "hasDown",
  Status_HAS_WATCH = "hasWatch",
  NO = "no",
  YES = "yes",
  qualityOptions = [{
    id: "video-mhb",
    quality: "dmb_w",
    text: "旧视频源-中画质宽版 (404p)",
    canSelect: !1
  }, {
    id: "video-mhb",
    quality: "sm_s",
    text: "旧视频源-低画质 (240p)",
    canSelect: !1
  }, {
    id: "video-mhb",
    quality: "dm_s",
    text: "旧视频源-中画质 (360p)",
    canSelect: !1
  }, {
    id: "video-mhb",
    quality: "dmb_s",
    text: "旧视频源-中画质 (480p)",
    canSelect: !1
  }, {
    id: "video-mhb",
    quality: "mhb_w",
    text: "旧视频源-高画质宽版 (404p)",
    canSelect: !1
  }, {
    id: "video-mmb",
    quality: "mmb",
    text: "中画质 (432p)",
    canSelect: !0
  }, {
    id: "video-dm",
    quality: "dm",
    text: "低画质 (1000kbps)",
    canSelect: !0
  }, {
    id: "video-dmb",
    quality: "dmb",
    text: "中画质 (1500kbps)",
    canSelect: !0
  }, {
    id: "video-mhb",
    quality: "mhb",
    text: "高画质 (576p)",
    canSelect: !0
  }, {
    id: "video-hmb",
    quality: "hmb",
    text: "HD (720p)",
    canSelect: !0
  }, {
    id: "video-hhb",
    quality: "hhb",
    text: "FullHD (1080p)",
    canSelect: !0
  }, {
    id: "video-hhbs",
    quality: "hhbs",
    text: "FullHD (1080p60fps)",
    canSelect: !0
  }, {
    id: "video-4k",
    quality: "4k",
    text: "4K (2160p)",
    canSelect: !0
  }, {
    id: "video-4ks",
    quality: "4ks",
    text: "4K (2160p60fps)",
    canSelect: !0
  }];

let detailPageCss$1 = "";

window.location.href.includes("hideNav=1") && (detailPageCss$1 = "\n         .navbar-default {\n            display: none !important;\n        }\n        body {\n            padding-top:0px!important;\n        }\n    ");

const javBusStyle = `
<style>
  .top-bar {
    z-index: 12345689 !important;
  }

  ${detailPageCss$1}

  .masonry {
    height: 100% !important;
    width: 100% !important;
    padding: 0 15px !important;
  }
  .masonry {
    display: grid;
    column-gap: 10px;
    row-gap: 10px;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    align-items: start;
  }
  .masonry .item {
    top: initial !important;
    left: initial !important;
    float: none !important;
    background-color: #c4b1b1;
    position: relative !important;
  }
  .masonry .item:hover {
    box-shadow: 0 .5em 1em -.125em rgba(10, 10, 10, .1), 0 0 0 1px #485fc7;
  }
  .masonry .movie-box {
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    overflow: inherit !important;
  }
  .masonry .movie-box .photo-frame {
    height: auto !important;
    margin: 0 !important;
    position: relative;
  }
  .masonry .movie-box img {
    max-height: 500px;
    height: 100% !important;
    object-fit: contain;
    object-position: top;
  }
  .masonry .movie-box img:hover {
    transform: scale(1.04);
    transition: transform 0.3s;
  }
  .masonry .photo-info span {
    display: inline-block;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .photo-frame .mheyzo,
  .photo-frame .mcaribbeancom2 {
    margin-left: 0 !important;
  }
  .avatar-box {
    width: 100% !important;
    display: flex !important;
    margin: 0 !important;
  }
  .avatar-box .photo-info {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 30px;
    flex-direction: row;
    background-color: #fff !important;
  }
  footer {
    display: none !important;
  }
  .video-title {
    white-space: normal !important;
    height: 75px;
    display: -webkit-box !important;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }
</style>
`;

let detailPageCss = "";
window.location.href.includes("hideNav=1") && (detailPageCss = "\n        .main-nav,#search-bar-container {\n            display: none !important;\n        }\n        \n        html {\n            padding-top:0px!important;\n        }\n    ");

const javdbStyle = `
<style>
  ${detailPageCss}

  .navbar {
    z-index: 12345679 !important;
    padding: 0 0;
  }

  .navbar-link:not(.is-arrowless) {
    padding-right: 33px;
  }

  .sub-header,
  #footer,
  .app-desktop-banner,
  div[data-controller="movie-tab"] .tabs,
  h3.main-title,
  div.video-detail > div:nth-child(4) > div > div.tabs.no-bottom > ul > li:nth-child(3),
  div.video-detail > div:nth-child(4) > div > div.tabs.no-bottom > ul > li:nth-child(2),
  div.video-detail > div:nth-child(4) > div > div.tabs.no-bottom > ul > li:nth-child(1),
  .top-meta,
  .float-buttons {
    display: none !important;
  }

  div.tabs.no-bottom,
  .tabs ul {
    border-bottom: none !important;
  }

  .movie-list .item {
    position: relative !important;
  }

  .video-title {
    white-space: normal !important;
    height: 80px;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  .main-tabs, .tabs {
    overflow-x: hidden;
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .main-tabs ul, .tabs ul {
    flex-wrap: wrap;
    flex-grow: 0;
  }

  .toolbar {
    display: flex;
  }
</style>
`;

const mainCss = `
<style>
  /* 全局通用样式 */
  .fr-btn {
    float: right;
    margin-left: 4px !important;
  }

  .menu-box {
    position: fixed;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    z-index: 1000;
    gap: 6px;
  }

  .menu-btn {
    display: inline-block;
    min-width: 80px;
    padding: 7px 12px;
    border-radius: 4px;
    color: white !important;
    text-decoration: none;
    font-weight: bold;
    font-size: 12px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
    border: none;
    line-height: 1.3;
    margin: 0;
  }

  .menu-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
    opacity: 0.9;
  }

  .menu-btn:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .do-hide {
    display: none !important;
  }

  .main-tab-btn {
    border-bottom: none !important;
    border-radius: 3px !important;
    height: 30px;
    margin-left: 5px !important;
  }

  .jhs-icon {
    width: 16px;
    height: 16px;
    vertical-align: middle;
    margin-right: 5px;
  }

  .tool-box .jhs-icon {
    width: 1.5rem;
    height: 1.5rem;
  }

  .tabulator {
    margin: 0 !important;
  }

  .tabulator .tabulator-row .action-cell-dropdown {
    overflow: visible !important;
  }

  .tabulator .tabulator-row.tabulator-selectable:hover {
    cursor: default !important;
  }

  .tabulator .tabulator-col.tabulator-sortable[aria-sort="ascending"] .tabulator-arrow {
    border-bottom-color: #337ab7 !important;
  }

  .tabulator .tabulator-col.tabulator-sortable[aria-sort="descending"] .tabulator-arrow {
    border-top-color: #337ab7 !important;
  }

  .tabulator-responsive-collapse {
    border-top: none !important;
  }

  .tabulator-responsive-collapse table {
    margin-left: 50px !important;
  }

  .tabulator-cell {
    height: auto !important;
  }

  .tabulator .tabulator-cell {
    white-space: normal !important;
    text-overflow: clip !important;
  }

  .tabulator-tableholder {
    overflow-x: hidden !important;
  }

  .jhs-scrollbar::-webkit-scrollbar,
  .content-panel::-webkit-scrollbar,
  .tabulator-tableholder::-webkit-scrollbar,
  .has-navbar-fixed-top::-webkit-scrollbar,
  .layui-layer-content::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  .jhs-scrollbar::-webkit-scrollbar-track,
  .content-panel::-webkit-scrollbar-track,
  .tabulator-tableholder::-webkit-scrollbar-track,
  .has-navbar-fixed-top::-webkit-scrollbar-track,
  .layui-layer-content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }

  .jhs-scrollbar::-webkit-scrollbar-thumb,
  .content-panel::-webkit-scrollbar-thumb,
  .tabulator-tableholder::-webkit-scrollbar-thumb,
  .has-navbar-fixed-top::-webkit-scrollbar-thumb,
  .layui-layer-content::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 10px;
  }

  .jhs-scrollbar::-webkit-scrollbar-thumb:hover,
  .content-panel::-webkit-scrollbar-thumb:hover,
  .tabulator-tableholder::-webkit-scrollbar-thumb:hover,
  .has-navbar-fixed-top::-webkit-scrollbar-thumb:hover,
  .layui-layer-content::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  .jhs-setting-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    z-index: 999999;
    width: 600px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
  }

  .jhs-setting-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #e2e8f0;
  }

  .jhs-setting-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
  }

  .jhs-setting-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }

  .jhs-setting-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px 20px;
    border-top: 1px solid #e2e8f0;
  }

  .jhs-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    z-index: 999998;
  }

  .jhs-preview-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    z-index: 2147483647;
    display: flex;
    overflow: auto;
    cursor: zoom-out;
    backdrop-filter: blur(5px);
  }
  .jhs-preview-img {
    border-radius: 4px;
    margin: auto;
    cursor: zoom-in;
    max-width: 95vw;
    max-height: 95vh;
    object-fit: contain;
    display: block;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  }
  .jhs-preview-img.zoomed {
    max-width: none;
    max-height: none;
    cursor: zoom-out;
  }
  .jhs-preview-toolbar {
    position: fixed;
    top: 20px;
    right: 20px;
    display: flex;
    gap: 8px;
    z-index: 2147483648;
    background: #fff;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }
  .jhs-preview-btn {
    padding: 7px 16px;
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }
  .jhs-preview-btn:hover {
    background: #e5e7eb;
    border-color: #9ca3af;
  }
  .jhs-preview-btn.active {
    color: #fff;
    background: #2ecc71;
    border-color: #2ecc71;
  }
  .jhs-loading-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 2147483649;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 18px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .jhs-loading-spinner {
    text-align: center;
  }
  .jhs-loading-spinner .spinner {
    width: 40px;
    height: 40px;
    margin: 0 auto 12px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: jhs-spin 0.6s linear infinite;
  }
  @keyframes jhs-spin {
    to { transform: rotate(360deg); }
  }
  .jhs-preview-toast {
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translate(-50%, -20px);
    z-index: 2147483650;
    padding: 10px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    color: #fff;
    opacity: 0;
    transition: opacity 0.3s ease, transform 0.3s ease;
    pointer-events: none;
  }
  .jhs-preview-toast.show {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  .jhs-preview-toast-error {
    background: rgba(220, 38, 38, 0.9);
    box-shadow: 0 4px 16px rgba(220, 38, 38, 0.4);
  }
  .jhs-preview-toast-info {
    background: rgba(59, 130, 246, 0.9);
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
  }

  .magnet-4k-highlight {
    background-color: #fff5f5 !important;
  }
  .magnet-4k-highlight .name {
    color: #f40 !important;
  }

  .msf-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 999997;
  }
  .msf-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
    z-index: 999998;
    width: 380px;
    display: flex;
    flex-direction: column;
  }
  .msf-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
    border-radius: 10px 10px 0 0;
  }
  .msf-title {
    font-size: 15px;
    font-weight: 600;
    color: #1e293b;
  }
  .msf-close {
    font-size: 22px;
    color: #9ca3af;
    cursor: pointer;
    padding: 0 6px;
    line-height: 1;
    transition: color 0.2s;
  }
  .msf-close:hover {
    color: #ef4444;
  }
  .msf-body {
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .msf-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .msf-section-title {
    font-size: 13px;
    font-weight: 600;
    color: #6b7280;
  }
  .msf-sort-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .msf-sort-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    cursor: default;
    transition: all 0.2s;
    user-select: none;
  }
  .msf-sort-item:hover {
    border-color: #cbd5e1;
    background: #f1f5f9;
  }
  .msf-sort-item.msf-dragging {
    opacity: 0.5;
    border-color: #3b82f6;
    background: #eff6ff;
  }
  .msf-sort-item.msf-drag-over {
    border-color: #3b82f6;
    background: #eff6ff;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
  .msf-drag-handle {
    color: #cbd5e1;
    font-size: 16px;
    cursor: grab;
    line-height: 1;
    letter-spacing: -2px;
    transition: color 0.2s;
  }
  .msf-drag-handle:active {
    cursor: grabbing;
  }
  .msf-sort-item:hover .msf-drag-handle {
    color: #94a3b8;
  }
  .msf-sort-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #374151;
    cursor: pointer;
    flex: 1;
  }
  .msf-sort-checkbox {
    margin: 0;
    cursor: pointer;
    width: 16px;
    height: 16px;
  }
  .msf-sort-hint {
    font-size: 12px;
    color: #9ca3af;
    margin-left: 4px;
  }
  .msf-filter-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .msf-filter-label {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 14px;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
  }
  .msf-filter-label:hover {
    border-color: #cbd5e1;
    background: #f1f5f9;
  }
  .msf-filter-checkbox {
    margin: 0;
    cursor: pointer;
    width: 16px;
    height: 16px;
  }
  .msf-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 14px 18px;
    border-top: 1px solid #e5e7eb;
  }
  .msf-btn {
    padding: 8px 22px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .msf-btn-cancel {
    background: #f3f4f6;
    color: #374151;
  }
  .msf-btn-cancel:hover {
    background: #e5e7eb;
  }
  .msf-btn-confirm {
    background: #3b82f6;
    color: #fff;
  }
  .msf-btn-confirm:hover {
    background: #2563eb;
  }
</style>
`;

const subtitleModalCss = `
<style>
  .pdb-sub-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .pdb-sub-modal {
    background: #fff;
    border-radius: 10px;
    width: 85vw;
    max-width: 1100px;
    height: 85vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.2);
  }
  .pdb-sub-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
    flex-shrink: 0;
  }
  .pdb-sub-search-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
  }
  .pdb-sub-title {
    font-weight: 600;
    font-size: 14px;
    color: #374151;
    white-space: nowrap;
  }
  .pdb-sub-input {
    flex: 1;
    max-width: 400px;
    padding: 8px 14px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
  }
  .pdb-sub-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  .pdb-sub-btn {
    padding: 8px 18px;
    background: #3b82f6;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s;
    white-space: nowrap;
  }
  .pdb-sub-btn:hover {
    background: #2563eb;
  }
  .pdb-sub-115-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: 16px;
    flex-shrink: 1;
    min-width: 0;
    max-width: 360px;
  }
  .pdb-sub-checkbox-group {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    min-width: 0;
  }
  .pdb-sub-checkbox-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: #374151;
    cursor: pointer;
    white-space: nowrap;
  }
  .pdb-sub-checkbox {
    margin: 0;
    cursor: pointer;
  }
  .pdb-sub-close {
    font-size: 26px;
    color: #9ca3af;
    cursor: pointer;
    padding: 0 8px;
    line-height: 1;
    transition: color 0.2s;
  }
  .pdb-sub-close:hover {
    color: #ef4444;
  }
  .pdb-sub-body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  .pdb-sub-content {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  }
  .pdb-sub-preview-wrap {
    width: 45%;
    display: flex;
    flex-direction: column;
    border-left: 1px solid #e5e7eb;
    background: #1e1e1e;
  }
  .pdb-sub-preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid #333;
    color: #d1d5db;
    font-size: 13px;
    flex-shrink: 0;
  }
  .pdb-sub-preview-status {
    font-size: 12px;
    color: #6b7280;
  }
  .pdb-sub-textarea {
    flex: 1;
    background: #1e1e1e;
    color: #2ecc71;
    border: none;
    padding: 14px;
    font-family: Consolas, Monaco, monospace;
    font-size: 13px;
    line-height: 1.5;
    resize: none;
    outline: none;
    overflow-y: auto;
  }
  .pdb-sub-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .pdb-sub-table thead {
    position: sticky;
    top: 0;
    z-index: 1;
  }
  .pdb-sub-th {
    padding: 10px 12px;
    background: #f3f4f6;
    color: #374151;
    font-weight: 600;
    text-align: left;
    border-bottom: 2px solid #e5e7eb;
    white-space: nowrap;
  }
  .pdb-sub-tr {
    transition: background 0.15s;
  }
  .pdb-sub-tr:hover {
    background: #f9fafb;
  }
  .pdb-sub-tr.is-previewing {
    background: #eff6ff;
    outline: 2px solid #3b82f6;
    outline-offset: -2px;
  }
  .pdb-sub-td,
  .pdb-sub-td-lang,
  .pdb-sub-td-ext,
  .pdb-sub-td-provider {
    padding: 9px 12px;
    border-bottom: 1px solid #f3f4f6;
    vertical-align: middle;
  }
  .pdb-sub-td {
    word-break: break-all;
  }
  .pdb-sub-td-lang,
  .pdb-sub-td-ext {
    text-align: center;
    white-space: nowrap;
  }
  .pdb-sub-td-actions {
    padding: 9px 12px;
    border-bottom: 1px solid #f3f4f6;
    text-align: center;
    white-space: nowrap;
  }
  .pdb-sub-provider {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }
  .pdb-sub-provider--xunlei {
    background: #dbeafe;
    color: #1d4ed8;
  }
  .pdb-sub-provider--subtitlecat {
    background: #fef3c7;
    color: #92400e;
  }
  .pdb-sub-action-btn {
    padding: 4px 12px;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    margin: 0 2px;
    transition: opacity 0.2s;
  }
  .pdb-sub-btn-preview {
    background: #e0f2fe;
    color: #0369a1;
  }
  .pdb-sub-btn-preview:hover {
    background: #bae6fd;
  }
  .pdb-sub-btn-download {
    background: #dcfce7;
    color: #166534;
  }
  .pdb-sub-btn-download:hover {
    background: #bbf7d0;
  }
  .pdb-sub-btn-upload {
    background: #ede9fe;
    color: #5b21b6;
  }
  .pdb-sub-btn-upload:hover {
    background: #ddd6fe;
  }
  .pdb-sub-msg {
    text-align: center;
    padding: 40px 20px;
    color: #6b7280;
    font-size: 14px;
  }
</style>
`;

function insertStyle(css) {
  if (css) if (css.includes("<style>")) document.head.insertAdjacentHTML("beforeend", css); else {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }
}

isJavBus && insertStyle(javBusStyle);
isJavDb && insertStyle(javdbStyle);

insertStyle(
  '\n<style>\n    .a-normal, /* 白色 */\n    .a-primary, /* 浅蓝色 */\n    .a-success, /* 浅绿色 */\n    .a-danger, /* 浅粉色 */\n    .a-warning, /* 浅橙色 */\n    .a-info /* 灰色 */\n    {\n        display: inline-flex;\n        align-items: center;\n        justify-content: center;\n        padding: 6px 14px;\n        margin-right: 10px;\n        border-radius: 6px;\n        text-decoration: none;\n        font-size: 13px;\n        font-weight: 500;\n        transition: all 0.2s ease;\n        cursor: pointer;\n        border: 1px solid rgba(0, 0, 0, 0.08);\n        white-space: nowrap;\n    }\n    \n    .a-primary {\n        background: #e0f2fe;\n        color: #0369a1;\n        border-color: #bae6fd;\n    }\n    \n    .a-primary:hover {\n        background: #bae6fd;\n    }\n    \n    .a-success {\n        background: #dcfce7;\n        color: #166534;\n        border-color: #bbf7d0;\n    }\n    \n    .a-success:hover {\n        background: #bbf7d0;\n    }\n    \n    .a-danger {\n        background: #fee2e2;\n        color: #b91c1c;\n        border-color: #fecaca;\n    }\n    \n    .a-danger:hover {\n        background: #fecaca;\n    }\n    \n    .a-warning {\n        background: #ffedd5;\n        color: #9a3412;\n        border-color: #fed7aa;\n    }\n    \n    .a-warning:hover {\n        background: #fed7aa;\n    }\n    \n    .a-info {\n        background: #e2e8f0;\n        color: #334155;\n        border-color: #cbd5e1;\n    }\n    \n    .a-info:hover {\n        background: #cbd5e1;\n    }\n    \n    .a-normal {\n        background: transparent;\n        color: #64748b;\n        border-color: #cbd5e1;\n    }\n    \n    .a-normal:hover {\n        background: #f8fafc;\n    }\n</style>\n'
);

insertStyle(mainCss);
insertStyle(subtitleModalCss);

const isEligibleDmmCoverCode = (value) => {
  const raw = String(value || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{2,10}-\d{1,6}$/.test(raw)) return false;
  const code = raw.replace(/\s+/g, '-').toUpperCase();
  if (!/^[A-Z0-9]{2,10}-\d{1,6}$/.test(code) || /^FC2-/.test(code)) return false;
  if (/^\d{6}[-_]\d{2,3}$/.test(code)) return false;
  if (/^(DUGA|MYWIFE|HEYZO|PACO|10MU|1PONDO|CARIBBEAN|CARIB|TOKYO|GACHI|REAL|JUKU|AKA|NTR)-/.test(code)) return false;
  return true;
};

export {
  __defProp,
  __typeError,
  __publicField,
  __privateMethod,
  currentHref,
  isJavDb,
  isJavBus,
  isSearchPage,
  isEligibleDmmCoverCode,
  Status_RUNNING,
  Status_SUCCESS,
  Status_FAIL,
  Status_LOADING,
  Status_FILTER,
  Status_FAVORITE,
  Status_HAS_DOWN,
  Status_HAS_WATCH,
  NO,
  YES,
  qualityOptions,
  detailPageCss$1,
  javBusStyle,
  detailPageCss,
  javdbStyle,
  mainCss,
  insertStyle,
};