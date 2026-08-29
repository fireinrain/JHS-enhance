import { BasePlugin } from '../core/base-plugin.js';
import { __publicField, isJavBus, isJavDb } from '../core/constants.js';

const Thumbnail = {
    sources: ['javfree', 'projectjav', 'javstore'],

    cacheKey(code) {
        return `thumb_cache_v3_${code}`;
    },

    lookupCode(code) {
        const text = String(code || '').trim();
        const fc2 = text.match(/^(?:FC2[-_\s]?(?:PPV[-_\s]?)?)?(\d{6,9})$/i);
        return fc2 ? fc2[1] : text;
    },

    sourceOrder() {
        const savedOrder = ['javfree', 'projectjav', 'javstore'];
        const seen = new Set();
        return [...savedOrder, ...this.sources].filter(src => {
            if (seen.has(src) || typeof this[src] !== 'function') return false;
            seen.add(src);
            return true;
        });
    },

    async fetchFromSource(source, code) {
        try {
            return await this[source](this.lookupCode(code));
        } catch (e) {
            clog.debug(`Thumbnail[${source}] 异常:`, e.message);
            return null;
        }
    },

    normalizeForCompare(text) {
        return String(text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    },

    isCodeMatched(text, code) {
        const normalizedText = this.normalizeForCompare(text);
        const normalizedCode = this.normalizeForCompare(code);
        return !!normalizedCode && normalizedText.includes(normalizedCode);
    },

    isDetailMatched(doc, url, code) {
        const title = doc?.querySelector('title')?.textContent || '';
        const headings = [...(doc?.querySelectorAll('h1,h2,h3,.entry-title,.movie-title,.post-title') || [])]
            .map(el => el.textContent || '').join(' ');
        const bodyText = (doc?.body?.textContent || '').slice(0, 5000);
        return this.isCodeMatched([url, title, headings, bodyText].join(' '), code);
    },

    normalizePreviewUrl(url, baseUrl = '') {
        if (!url) return '';
        const absolute = /^https?:\/\//i.test(url)
            ? url : (baseUrl ? new URL(url, baseUrl).href : url);
        return absolute.replace(/^http:/, 'https:');
    },

    isJavfreePreviewImage(url, code) {
        const cleanUrl = String(url || '').split('?')[0];
        const lookupCode = this.lookupCode(code);
        const isFc2Numeric = /^\d{6,9}$/.test(lookupCode);
        const fc2ShotPattern = isFc2Numeric
            ? new RegExp(`${lookupCode}_\\d+\\.(?:jpe?g|png|webp)$`, 'i')
            : null;
        return this.isCodeMatched(cleanUrl, code) && (
            /-(?:1080p|demosaic)\.(?:jpe?g|png|webp)$/i.test(cleanUrl) ||
            (isFc2Numeric && fc2ShotPattern.test(cleanUrl))
        );
    },

    selectJavfreePreviewUrl(doc, detailUrl, code) {
        const urls = [...doc.querySelectorAll('p > img[src]')]
            .map(img => this.normalizePreviewUrl(img.getAttribute('src') || img.src || '', detailUrl))
            .filter(url => this.isJavfreePreviewImage(url, code));
        return urls.find(url => /-1080p\./i.test(url)) ||
            urls.find(url => /-demosaic\./i.test(url)) ||
            urls.find(url => /_1\.(?:jpe?g|png|webp)$/i.test(url)) || '';
    },

    async javfree(code) {
        code = this.lookupCode(code);
        const cacheKey = this.cacheKey(code);
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) return cached;

        try {
            const html = await gmHttp.get(`https://javfree.me/search/${code}`);
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const link = [...doc.querySelectorAll('.entry-title>a')]
                .find(a => this.isCodeMatched([a.href, a.textContent].join(' '), code))?.href;
            if (!link) return null;

            const dHtml = await gmHttp.get(link);
            const dDoc = new DOMParser().parseFromString(dHtml, 'text/html');
            if (!this.isDetailMatched(dDoc, link, code)) return null;

            const url = this.selectJavfreePreviewUrl(dDoc, link, code);
            if (url) {
                sessionStorage.setItem(cacheKey, url);
                return url;
            }
            return null;
        } catch {
            return null;
        }
    },

    async javstore(code) {
        code = this.lookupCode(code);
        try {
            const normalizedCode = code.replace(/^fc2-?/i, '').replace(/-/g, '').toLowerCase();
            const searchUrl = `https://javstore.net/search?q=${encodeURIComponent(code)}`;
            const searchHtml = await gmHttp.get(searchUrl);
            const searchDoc = new DOMParser().parseFromString(searchHtml, 'text/html');

            const candidateLinks = searchDoc.querySelectorAll('a[href*="/"]');
            const detailUrls = [];
            for (const link of candidateLinks) {
                const href = link.getAttribute('href');
                if (!href) continue;
                if (href.startsWith('http') && !href.includes('javstore.net')) continue;
                const urlObj = new URL(href, searchUrl);
                if (!/javstore\.net$/i.test(urlObj.hostname)) continue;
                if (/^\/search(?:[/?#]|$)/i.test(urlObj.pathname)) continue;
                const fullUrl = urlObj.href;
                const pathLastPart = decodeURIComponent(urlObj.pathname.split('/').pop() || '');
                const normalizedPath = pathLastPart.toLowerCase().replace(/-/g, '');
                const looksLikeDetail = /\.html$/i.test(urlObj.pathname) || /^\/\d+[-/]/.test(urlObj.pathname);
                if (looksLikeDetail && normalizedPath.includes(normalizedCode) && !detailUrls.includes(fullUrl)) {
                    detailUrls.push(fullUrl);
                }
            }
            if (detailUrls.length === 0) return null;

            for (const detailUrl of detailUrls) {
                const imgUrl = await this._extractImgFromDetail(detailUrl, code);
                if (imgUrl) return imgUrl;
            }
            return null;
        } catch (e) {
            clog.debug('javstore 获取失败', e);
            return null;
        }
    },

    async _extractImgFromDetail(detailUrl, code) {
        try {
            const detailHtml = await gmHttp.get(detailUrl);
            const detailDoc = new DOMParser().parseFromString(detailHtml, 'text/html');
            if (!this.isDetailMatched(detailDoc, detailUrl, code)) return null;

            for (const link of detailDoc.querySelectorAll('a')) {
                if (link.textContent.includes('CLICK HERE')) {
                    const imgUrl = link.href || link.getAttribute('href') || '';
                    if (imgUrl) return this.normalizePreviewUrl(imgUrl, detailUrl);
                }
            }

            const img = detailDoc.querySelector('img[src*="_s.jpg"]');
            if (img) {
                let src = img.getAttribute('src') || '';
                if (!src.startsWith('http')) src = new URL(src, detailUrl).href;
                return this.normalizePreviewUrl(src.replace(/_s\.jpg$/, '_l.jpg'), detailUrl);
            }
            return null;
        } catch (e) {
            clog.debug('javstore: 详情页请求失败', detailUrl, e.message);
            return null;
        }
    },

    async projectjav(code) {
        code = this.lookupCode(code);
        try {
            const request = (url) => gmHttp.get(url, {}, {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
            });

            const searchUrl = `https://projectjav.com/?searchTerm=${encodeURIComponent(code)}`;
            const searchHtml = await request(searchUrl);
            const searchDoc = new DOMParser().parseFromString(searchHtml, 'text/html');

            let detailUrl = '';
            const allMovieLinks = [...searchDoc.querySelectorAll('a[href*="/movie/"]')];
            const firstLink = allMovieLinks[0]?.getAttribute('href') || '';
            if (firstLink) {
                detailUrl = firstLink.startsWith('http') ? firstLink : `https://projectjav.com${firstLink}`;
            }
            if (!detailUrl) return null;

            const detailHtml = await request(detailUrl);
            const detailDoc = new DOMParser().parseFromString(detailHtml, 'text/html');

            const screenshotLink = [...detailDoc.querySelectorAll('.col-md-12.thumbnail a[data-featherlight="image"], .thumbnail a[data-featherlight="image"]')]
                .find(a => this.isCodeMatched([a.outerHTML, a.closest('.thumbnail')?.outerHTML, detailUrl].join(' '), code));

            if (screenshotLink) {
                const thumbImg = screenshotLink.querySelector('img');
                const href = screenshotLink.getAttribute('href') || '';
                if (href) return this.normalizePreviewUrl(href, detailUrl);
                if (thumbImg) {
                    const src = (thumbImg.getAttribute('src') || '').replace(/\?.*$/, '');
                    if (src) return this.normalizePreviewUrl(src, detailUrl);
                }
            }
            return null;
        } catch (e) {
            clog.debug('[projectjav] 异常:', e.message);
            return null;
        }
    },

    async get(code) {
        const cacheKey = this.cacheKey(code);
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) return {url: cached, source: null};

        let url = null, source = null;
        for (const src of this.sourceOrder()) {
            url = await this.fetchFromSource(src, code);
            if (url) {
                source = src;
                break;
            }
        }

        if (url) sessionStorage.setItem(cacheKey, url);
        return {url, source};
    }
};

let previewOverlay = null;

function showPreviewOverlay(imgUrl, code, source = null) {
    if (previewOverlay) {
        previewOverlay.close();
    }
    let currentBlobUrl = null;

    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const container = document.createElement('div');
    container.className = 'jhs-preview-overlay';

    const img = document.createElement('img');
    img.src = imgUrl;
    img.className = 'jhs-preview-img';
    img.onclick = (e) => {
        e.stopPropagation();
        img.classList.toggle('zoomed');
    };
    img.onerror = () => {
        img.src = imgUrl;
    };

    const toolbar = document.createElement('div');
    toolbar.className = 'jhs-preview-toolbar';

    const createButton = (text, className, onClick) => {
        const btn = document.createElement('button');
        btn.className = `jhs-preview-btn ${className}`;
        btn.textContent = text;
        btn.onclick = onClick;
        return btn;
    };

    const setActiveSource = (activeSource) => {
        toolbar.querySelectorAll('.jhs-preview-btn').forEach(b => b.classList.remove('active'));
        const activeBtn = toolbar.querySelector(`.jhs-preview-btn-${activeSource}`);
        if (activeBtn) activeBtn.classList.add('active');
    };

    const changeSource = async (src, srcName) => {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'jhs-loading-overlay';
        loadingOverlay.innerHTML = '<div class="jhs-loading-spinner"><div class="spinner"></div><div>正在加载预览图...</div></div>';
        document.body.appendChild(loadingOverlay);
        try {
            const newUrl = src === 'javfree' ? await Thumbnail.javfree(code)
                : src === 'projectjav' ? await Thumbnail.projectjav(code)
                    : await Thumbnail.javstore(code);
            if (newUrl) {
                if (currentBlobUrl) {
                    URL.revokeObjectURL(currentBlobUrl);
                    currentBlobUrl = null;
                }
                img.src = newUrl;
                setActiveSource(src);
            } else {
                showToast(`${srcName} 未找到预览图`, 'error');
            }
        } catch (err) {
            showToast(`${srcName} 加载失败: ${err.message}`, 'error');
        } finally {
            loadingOverlay.remove();
        }
    };

    let toastTimer = null;
    const showToast = (msg, type = 'info') => {
        const existing = container.querySelector('.jhs-preview-toast');
        if (existing) existing.remove();
        if (toastTimer) clearTimeout(toastTimer);

        const toast = document.createElement('div');
        toast.className = `jhs-preview-toast jhs-preview-toast-${type}`;
        toast.textContent = msg;
        container.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('show'));
        toastTimer = setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    const javfreeBtn = createButton('javfree', 'jhs-preview-btn-javfree javfree', (e) => {
        e.stopPropagation();
        changeSource('javfree', 'javfree');
    });

    const projectjavBtn = createButton('projectjav', 'jhs-preview-btn-projectjav projectjav', (e) => {
        e.stopPropagation();
        changeSource('projectjav', 'projectjav');
    });

    const javstoreBtn = createButton('javstore', 'jhs-preview-btn-javstore javstore', (e) => {
        e.stopPropagation();
        changeSource('javstore', 'javstore');
    });

    const newWindowBtn = createButton('新窗口打开', 'jhs-preview-btn-action action', (e) => {
        e.stopPropagation();
        window.open(img.src);
    });

    const downloadBtn = createButton('下载', 'jhs-preview-btn-action action', (e) => {
        e.stopPropagation();
        const a = document.createElement('a');
        a.href = img.src;
        a.download = `${code}.jpg`;
        a.click();
    });

    toolbar.appendChild(javfreeBtn);
    toolbar.appendChild(projectjavBtn);
    toolbar.appendChild(javstoreBtn);
    toolbar.appendChild(newWindowBtn);
    toolbar.appendChild(downloadBtn);

    if (source === 'javfree') setActiveSource('javfree');
    else if (source === 'projectjav') setActiveSource('projectjav');
    else if (source === 'javstore') setActiveSource('javstore');
    else setActiveSource('javfree');

    container.appendChild(img);

    const closeOverlay = () => {
        if (container.parentNode) {
            container.remove();
            toolbar.remove();
            document.documentElement.style.overflow = originalHtmlOverflow;
            document.body.style.overflow = originalBodyOverflow;
            if (currentBlobUrl) {
                URL.revokeObjectURL(currentBlobUrl);
                currentBlobUrl = null;
            }
        }
    };

    container.onclick = closeOverlay;

    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeOverlay();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);

    document.body.appendChild(container);
    document.body.appendChild(toolbar);
    previewOverlay = {container, toolbar, close: closeOverlay};
}

class ScreenShotPlugin extends BasePlugin {
    getName() {
        return "ScreenShotPlugin";
    }

    async handle() {
        this.loadScreenShot().then();
    }

    async loadScreenShot() {
        if (!window.isDetailPage) return;
        if ("yes" !== await storageManager.getSetting("enableLoadScreenShot", "yes")) return;
        let carNum2 = this.getPageInfo().carNum;

        isJavDb && $(".preview-images .tile-item").first().before(
            '<a class="tile-item screen-container" style="overflow:hidden;max-height:215px;text-align:center;">' +
            '<div style="margin-top:50px;color:#000;cursor:auto">正在加载缩略图</div></a>'
        );
        isJavBus && $("#sample-waterfall .sample-box:first").after(
            '<a class="sample-box screen-container" style="overflow:hidden;height:110px;text-align:center;">' +
            '<div style="margin-top:30px;color:#000;cursor:auto">正在加载缩略图</div></a>'
        );

        try {
            const result = await Thumbnail.get(carNum2);
            if (result.url) {
                this.addImg("缩略图", result.url, carNum2, result.source);
                clog.log("加载缩略图:", result.url, result.source);
            } else {
                this.showErrorFallback(carNum2, new Error("所有来源均未找到预览图"));
            }
        } catch (e) {
            this.showErrorFallback(carNum2, e);
        }
    }

    async getScreenshot(carNum2) {
        const result = await Thumbnail.get(carNum2);
        if (result.url) return result.url;
        throw new Error("未找到预览图");
    }

    async getJavStoreScreenShot(carNum2) {
        return await Thumbnail.javstore(carNum2);
    }

    async getJavFreeScreenShot(carNum2) {
        return await Thumbnail.javfree(carNum2);
    }

    addImg(title, imgUrl, code, source) {
        if (!imgUrl) return;
        isJavDb && $(".screen-container").html(
            `<img src="${imgUrl}" alt="${title}" loading="lazy" style="width:100%;">`
        );
        isJavBus && $(".screen-container").html(
            `<div class="photo-frame"><img src="${imgUrl}" style="height:inherit;width:100%;" title="${title}" alt="${title}"></div>`
        );
        $(".screen-container").on("click", (event) => {
            event.stopPropagation();
            event.preventDefault();
            showPreviewOverlay(imgUrl, code || title, source);
        });
    }

    showErrorFallback(carNum2, error) {
        console.error("获取缩略图失败:", error?.message?.substring?.(0, 100) || error);
        let differentCss = isJavBus ? "margin-top:30px" : "margin-top:50px";
        $(".screen-container").html(
            `<div style="${differentCss};cursor:auto;color:#000;">获取缩略图失败</div>` +
            `<br/><a href='#' class='retry-link'>点击重试</a> 或 ` +
            `<a class="check-link" href='https://javstore.net/search?q=${encodeURIComponent(carNum2)}' target='_blank'>前往确认</a>`
        ).off("click", ".retry-link").off("click", ".check-link")
            .on("click", ".retry-link", async (e) => {
            e.stopPropagation();
            e.preventDefault();
                $(".screen-container").html(
                    `<div style="${differentCss};cursor:auto;color:#000;">正在重新加载...</div>`
                );
            try {
                const result = await Thumbnail.get(carNum2);
                if (result.url) {
                    this.addImg("缩略图", result.url, carNum2, result.source);
                } else {
                    this.showErrorFallback(carNum2, new Error("所有来源均未找到预览图"));
                }
            } catch (err) {
                this.showErrorFallback(carNum2, err);
            }
            }).on("click", ".check-link", (e) => {
            e.stopPropagation();
            e.preventDefault();
            window.open(`https://javstore.net/search?q=${encodeURIComponent(carNum2)}`, "_blank");
        });
    }
}

export {ScreenShotPlugin, Thumbnail, showPreviewOverlay};
window.showPreviewOverlay = showPreviewOverlay;