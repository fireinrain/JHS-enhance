import {qualityOptions} from '../core/constants.js';

const JAVXY_TOKEN = [118, 119, 112, 71, 97, 110, 28, 84, 124, 65, 76, 102, 65, 16, 77, 109, 64, 82, 85, 83, 67, 92, 125, 108, 83, 65, 124, 107, 84, 104, 71, 84, 17, 124, 118, 125, 104, 8, 125, 96, 112, 103, 29, 18, 82, 83, 87, 84]
    .map(v => String.fromCharCode(v ^ 0x25)).join('');

const JAVXY_ENDPOINTS = [
    {host: String.fromCharCode(106, 97, 118, 120, 121, 46, 99, 99, 46, 99, 100), label: 'Javxy'},
    {
        host: String.fromCharCode(119, 111, 114, 107, 101, 114, 46, 106, 97, 118, 120, 121, 46, 99, 99, 46, 99, 100),
        label: 'Javxy Worker'
    },
];

const JAVXY_SOURCE_LABELS = {
    'Tokyo-Hot': 'Javxy | Tokyo-Hot',
    FC2: 'Javxy | FC2',
    Direct: 'Javxy | Direct',
    DMM: 'Javxy | dmm',
    MGStage: 'Javxy | MGStage',
    DUGA: 'Javxy | DUGA',
    MYWIFE: 'Javxy | MyWife',
    JavTrailers: 'Javxy | JavTrailers',
    JavDB: 'Javxy | Javdb',
    AVWikiDB: 'Javxy | AVWikiDB',
    JAVDatabase: 'Javxy | JAVDatabase',
    HEYZO: 'Javxy | Heyzo',
    HeyDouga: 'Javxy | HeyDouga',
    PACO: 'Javxy | Paco',
    '10MU': 'Javxy | 10mu',
    Caribbean: 'Javxy | 加勒比',
    '1Pondo': 'Javxy | 一本道',
};

const JAVXY_QUALITY_OPTIONS = [
    {quality: '4k', text: '4K'},
    {quality: 'hhb', text: '1080p'},
    {quality: '1080p', text: '1080p'},
    {quality: 'hmb', text: '720p'},
    {quality: '720p', text: '720p'},
    {quality: 'mhb', text: '576p'},
    {quality: '540p', text: '540p'},
    {quality: 'mmb', text: '432p'},
    {quality: '480p', text: '480p'},
    {quality: '396p', text: '396p'},
    {quality: '360p', text: '360p'},
    {quality: '240p', text: '240p'},
];

const jpSourceFailedKey = (source = 'DMM') => `javxy_jp_source_failed_until_${String(source || '').toUpperCase()}`;

const isJpSourceTemporarilyFailed = (source = 'DMM') => {
    const until = Number(sessionStorage.getItem(jpSourceFailedKey(source)) || 0);
    if (!Number.isFinite(until) || until <= Date.now()) {
        sessionStorage.removeItem(jpSourceFailedKey(source));
        return false;
    }
    return true;
};

const markJpSourceTemporarilyFailed = (source = 'DMM') => {
    sessionStorage.setItem(jpSourceFailedKey(source), String(Date.now() + 30 * 60 * 1000));
};

const selectHighestQuality = (qualityMap) => {
    const rank = new Map(JAVXY_QUALITY_OPTIONS.map((item, index) => [item.quality, index]));
    return Object.keys(qualityMap || {})
        .filter(key => qualityMap[key])
        .sort((a, b) => (rank.get(a) ?? -1) - (rank.get(b) ?? -1))[0] || null;
};

const sortQualityKeys = (qualityMap) => {
    const rank = new Map(JAVXY_QUALITY_OPTIONS.map((item, index) => [item.quality, index]));
    return Object.keys(qualityMap || {})
        .filter(key => qualityMap[key])
        .sort((a, b) => (rank.get(a) ?? -1) - (rank.get(b) ?? -1));
};

const normalizeJavxySource = (value) => {
    const raw = String(value || '').trim().toLowerCase();
    if (raw.includes('fc2')) return 'FC2';
    if (raw.includes('mgstage')) return 'MGStage';
    if (raw.includes('heydouga')) return 'Direct';
    if (raw.includes('mywife')) return 'MYWIFE';
    if (raw.includes('duga')) return 'DUGA';
    if (raw.includes('javtrailers')) return 'JavTrailers';
    if (raw.includes('javdb')) return 'JavDB';
    if (raw.includes('avwikidb')) return 'AVWikiDB';
    if (raw.includes('javdatabase')) return 'JAVDatabase';
    if (raw.includes('dmm')) return 'DMM';
    if (raw === 'direct' || raw.includes('heyzo') || raw.includes('heydouga') || raw.includes('paco') || raw.includes('10musume') || raw.includes('10mu') || raw.includes('1pondo') || raw.includes('caribbean') || raw.includes('tokyo-hot') || raw.includes('tokyohot')) return 'Direct';
    return String(value || '').trim();
};

const javxyQualityMapToDmmFormat = (javxyQualityMap) => {
    const result = {};
    const qualityKeys = qualityOptions.map(o => o.quality);

    for (const [key, url] of Object.entries(javxyQualityMap || {})) {
        if (!url) continue;
        const lowerKey = key.toLowerCase();

        if (qualityKeys.includes(key)) {
            result[key] = url;
        } else if (qualityKeys.includes(lowerKey)) {
            result[lowerKey] = url;
        }
    }

    return result;
};

const fromJavxyCcCd = async (id, rawCode = '', options = {}) => {
    const query = String(id || rawCode || '').trim();
    if (!query) {
        clog.debug('Javxy 跳过：查询词为空');
        return null;
    }

    for (const endpoint of JAVXY_ENDPOINTS) {
        const params = new URLSearchParams({client: 'laosiji-new'});
        if (Array.isArray(options.skip) && options.skip.length) params.set('skip', options.skip.join(','));
        if (Array.isArray(options.prefer) && options.prefer.length) params.set('prefer', options.prefer.join(','));
        if (Array.isArray(options.source) && options.source.length) params.set('source', options.source.join(','));
        if (options.playbackFallback) params.set('purpose', 'playback-fallback');

        const apiUrl = `https://${endpoint.host}/trailers/${encodeURIComponent(query)}?${params}`;
        clog.debug('Javxy 请求 API', {query, apiUrl, endpoint: endpoint.label});

        let r;
        try {
            r = await gmHttp.get(apiUrl, null, {
                'Accept': 'application/json,text/plain,*/*',
                'X-Javxy-Token': JAVXY_TOKEN,
            }, {timeout: 8000});
        } catch (e) {
            clog.debug('Javxy API 网络失败，尝试下一个节点', {endpoint: endpoint.label, error: e.message});
            continue;
        }

        if (!r) {
            clog.debug('Javxy API 无响应，尝试下一个节点', {endpoint: endpoint.label});
            continue;
        }

        const trailerUrl = String(r?.trailer || '').trim();
        if (!trailerUrl) {
            clog.debug('Javxy 无 trailer 字段', {endpoint: endpoint.label, keys: Object.keys(r || {})});
            return null;
        }

        const qualityMap = r?.qualities && typeof r.qualities === 'object' ? r.qualities : {};
        const quality = r?.quality && qualityMap[r.quality] ? r.quality : selectHighestQuality(qualityMap);
        const sourceBase = JAVXY_SOURCE_LABELS[r?.source] || `Javxy | ${r?.source || 'dmm'}`;
        const directUrl = qualityMap[quality] || trailerUrl;

        clog.debug('Javxy 返回结果', {
            endpoint: endpoint.label,
            source: r?.source,
            quality,
            qualities: Object.keys(qualityMap),
            url: directUrl,
        });

        const dmmQualityMap = javxyQualityMapToDmmFormat(qualityMap);

        return {
            url: directUrl,
            source: sourceBase,
            type: String(r?.type || '').trim() || 'video',
            qualities: qualityMap,
            quality,
            directUrl,
            code: id,
            rawCode,
            javxySource: String(r?.source || '').trim(),
            requiresJP: Boolean(r?.requiresJP),
            urls: Array.isArray(r?.urls) && r.urls.length ? r.urls : sortQualityKeys(qualityMap).map(key => qualityMap[key]),
            dmmQualityMap,
        };
    }

    return null;
};

const fallbackJavxyResult = async (code, rawCode = '', failedSources = [], options = {}) => {
    const skip = [...new Set((failedSources || []).map(source => normalizeJavxySource(source)).filter(Boolean))];
    const source = [...new Set((options.source || []).map(s => String(s || '').trim()).filter(Boolean))];

    if (!skip.length && !source.length) return null;

    clog.debug('Javxy 播放失败回落查询', {code, skip, source});

    return fromJavxyCcCd(code, rawCode, {skip, source, playbackFallback: true});
};

const getJavxyVideoUrls = async (code, failedSources = []) => {
    const result = await fallbackJavxyResult(code, code, failedSources, {
        source: ['JavTrailers', 'JavDB'],
    });

    if (result?.dmmQualityMap && Object.keys(result.dmmQualityMap).length > 0) {
        return result.dmmQualityMap;
    }

    if (result?.url) {
        const qualityMap = {};
        qualityMap['720p'] = result.url;
        return qualityMap;
    }

    return null;
};

const getJavxyCover = async (code) => {
    const query = String(code || '').trim();
    if (!query) return null;

    for (const endpoint of JAVXY_ENDPOINTS) {
        const params = new URLSearchParams({client: 'laosiji-new'});
        const apiUrl = `https://${endpoint.host}/covers/${encodeURIComponent(query)}?${params}`;

        let r;
        try {
            r = await gmHttp.get(apiUrl, null, {
                'Accept': 'application/json,text/plain,*/*',
                'X-Javxy-Token': JAVXY_TOKEN,
            }, {timeout: 15000});
        } catch (e) {
            continue;
        }

        if (!r) continue;
        if (r?.found && (r.url || r.cover || r.highCover)) return r;
        return null;
    }
    return null;
};

export {
    fromJavxyCcCd,
    fallbackJavxyResult,
    getJavxyVideoUrls,
    getJavxyCover,
    normalizeJavxySource,
    isJpSourceTemporarilyFailed,
    markJpSourceTemporarilyFailed,
    JAVXY_TOKEN,
    JAVXY_ENDPOINTS,
};