import {GM_xmlhttpRequest} from 'vite-plugin-monkey/dist/client';

const HLS_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.18/dist/hls.min.js';

let hlsLoadPromise = null;

const getHlsClass = () => {
    const HlsClass = window.Hls || globalThis.Hls || (typeof Hls !== 'undefined' ? Hls : null);
    return HlsClass && HlsClass.isSupported && HlsClass.isSupported() ? HlsClass : null;
};

const binaryTextToArrayBuffer = (value) => {
    const text = String(value || '');
    const bytes = new Uint8Array(text.length);
    for (let index = 0; index < text.length; index += 1) {
        bytes[index] = text.charCodeAt(index) & 0xff;
    }
    return bytes.buffer;
};

const loadHlsLibrary = () => {
    const readyHls = getHlsClass();
    if (readyHls) return Promise.resolve(readyHls);
    if (hlsLoadPromise) return hlsLoadPromise;

    const loadByGm = () => new Promise((resolve) => {
        GM_xmlhttpRequest({
            method: 'GET',
            url: HLS_SCRIPT_URL,
            timeout: 15000,
            onload: (r) => {
                if (r.status >= 200 && r.status < 300 && r.responseText) {
                    try {
                        Function(`${r.responseText}\n//# sourceURL=${HLS_SCRIPT_URL}`).call(globalThis);
                    } catch (err) {
                        clog.error('HLS: hls.js 执行失败', err);
                    }
                }
                resolve(getHlsClass());
            },
            onerror: () => resolve(getHlsClass()),
            ontimeout: () => resolve(getHlsClass()),
        });
    });

    hlsLoadPromise = new Promise((resolve) => {
        const existing = document.querySelector('script[data-jhs-hls="1"]');
        if (existing) {
            existing.addEventListener('load', () => resolve(getHlsClass()), {once: true});
            existing.addEventListener('error', () => loadByGm().then(resolve), {once: true});
            setTimeout(() => {
                if (!getHlsClass()) loadByGm().then(resolve);
            }, 4000);
            return;
        }
        const hlsScript = document.createElement('script');
        hlsScript.src = HLS_SCRIPT_URL;
        hlsScript.async = true;
        hlsScript.dataset.jhsHls = '1';
        hlsScript.onload = () => resolve(getHlsClass());
        hlsScript.onerror = () => loadByGm().then(resolve);
        document.head.appendChild(hlsScript);
    }).then((HlsClass) => {
        if (!HlsClass) hlsLoadPromise = null;
        return HlsClass;
    });
    return hlsLoadPromise;
};

const createHlsLoader = () => {
    class GMHlsLoader {
        constructor(config) {
            this.config = config;
            this.context = null;
            this.callbacks = null;
            this.loader = null;
            this.stats = this.createStats();
        }

        createStats() {
            return {
                aborted: false,
                loaded: 0,
                retry: 0,
                total: 0,
                chunkCount: 0,
                bwEstimate: 0,
                trequest: 0,
                tfirst: 0,
                tload: 0,
                loading: {start: 0, first: 0, end: 0},
                parsing: {start: 0, end: 0},
                buffering: {start: 0, first: 0, end: 0},
            };
        }

        destroy() {
            this.abort();
        }

        abort() {
            if (this.stats) this.stats.aborted = true;
            if (this.loader) {
                try {
                    this.loader.abort();
                } catch (e) { /* ignore */
                }
            }
            this.loader = null;
        }

        load(context, config, callbacks) {
            this.context = context;
            this.callbacks = callbacks;
            const requestUrl = context.url;
            const wantsArrayBuffer =
                context.responseType === 'arraybuffer' ||
                /\.(?:ts|m4s|mp4|key)(?:[?#]|$)/i.test(requestUrl);
            const startedAt = performance.now();
            const stats = (this.stats = this.createStats());
            stats.trequest = startedAt;
            stats.tfirst = startedAt;
            stats.tload = startedAt;
            stats.loading.start = startedAt;

            this.loader = GM_xmlhttpRequest({
                method: 'GET',
                url: requestUrl,
                responseType: 'text',
                overrideMimeType: wantsArrayBuffer ? 'text/plain; charset=x-user-defined' : undefined,
                timeout: config && config.timeout ? config.timeout : 20000,
                headers: {
                    Accept: wantsArrayBuffer
                        ? '*/*'
                        : 'application/vnd.apple.mpegurl, application/x-mpegURL, */*',
                },
                onprogress: (event) => {
                    stats.loaded = Number(event && event.loaded ? event.loaded : stats.loaded || 0);
                    stats.total = Number(event && event.total ? event.total : stats.total || stats.loaded || 0);
                    if (!stats.loading.first && stats.loaded > 0) {
                        stats.loading.first = performance.now();
                    }
                },
                onload: (r) => {
                    const status = Number(r.status || 0);
                    const response = {
                        code: status,
                        text: r.statusText || '',
                        url: r.finalUrl || requestUrl,
                    };
                    stats.tfirst = stats.tfirst || performance.now();
                    stats.tload = performance.now();
                    stats.loading.first = stats.loading.first || stats.tload;
                    stats.loading.end = stats.tload;
                    if (status < 200 || status >= 300) {
                        callbacks.onError && callbacks.onError(response, context, null, stats);
                        return;
                    }
                    const responseText = r.responseText || r.response || '';
                    const data = wantsArrayBuffer
                        ? binaryTextToArrayBuffer(responseText)
                        : responseText;
                    stats.loaded = data && data.byteLength ? data.byteLength : (data && data.length ? data.length : stats.loaded || 0);
                    stats.total = stats.total || stats.loaded;
                    stats.bwEstimate =
                        stats.loading.end > stats.loading.first
                            ? Math.round((stats.total * 8000) / (stats.loading.end - stats.loading.first))
                            : 0;
                    callbacks.onSuccess && callbacks.onSuccess({data, url: response.url}, stats, context, response);
                },
                onerror: () => {
                    callbacks.onError &&
                    callbacks.onError({code: 0, text: 'network error', url: requestUrl}, context, null, stats);
                },
                ontimeout: () => {
                    stats.tload = performance.now();
                    stats.loading.end = stats.tload;
                    callbacks.onTimeout && callbacks.onTimeout(stats, context, null);
                },
            });
        }
    }

    return GMHlsLoader;
};

const isM3U8Url = (url) => /\.m3u8(?:[?#].*)?$/i.test(String(url || ''));

const attachHlsToVideo = (videoEl, src) => {
    return new Promise((resolve, reject) => {
        if (!videoEl || !src) {
            reject(new Error('video element or source missing'));
            return;
        }

        const HlsClass = getHlsClass();
        if (!HlsClass) {
            videoEl.src = src;
            videoEl.load && videoEl.load();
            resolve(false);
            return;
        }

        const hls = new HlsClass({
            enableWorker: false,
            lowLatencyMode: true,
            loader: createHlsLoader(),
            autoStartLoad: true,
            startPosition: 0,
            capLevelToPlayerSize: true,
            testBandwidth: false,
            preferManagedMediaSource: false,
            maxBufferLength: 6,
            maxMaxBufferLength: 12,
            backBufferLength: 30,
            maxBufferHole: 0.5,
            nudgeOffset: 0.1,
            manifestLoadingMaxRetry: 2,
            levelLoadingMaxRetry: 2,
            fragLoadingMaxRetry: 2,
            manifestLoadingTimeOut: 12000,
            levelLoadingTimeOut: 12000,
            fragLoadingTimeOut: 12000,
            abrEwmaFastLive: 3,
            abrEwmaSlowLive: 9,
        });

        hls.on(HlsClass.Events.MANIFEST_PARSED, () => {
            hls.startLoad(0);
            videoEl.play().catch(() => {
            });
            resolve(true);
        });

        hls.on(HlsClass.Events.ERROR, (_, data) => {
            if (!data || !data.fatal) return;
            clog.error('HLS: 播放失败', data);
            if (data.type === HlsClass.ErrorTypes.MEDIA_ERROR) {
                if (videoEl.readyState >= 2) {
                    try {
                        hls.recoverMediaError && hls.recoverMediaError();
                    } catch (e) { /* ignore */
                    }
                    return;
                }
            }
            reject(new Error(data.details || 'HLS fatal error'));
        });

        hls.loadSource(src);
        hls.attachMedia(videoEl);
        videoEl._hls = hls;
    });
};

const destroyHls = (videoEl) => {
    if (videoEl && videoEl._hls) {
        try {
            videoEl._hls.destroy();
        } catch (e) { /* ignore */
        }
        videoEl._hls = null;
    }
};

export {loadHlsLibrary, getHlsClass, createHlsLoader, isM3U8Url, attachHlsToVideo, destroyHls, HLS_SCRIPT_URL};