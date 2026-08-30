import {GM_xmlhttpRequest} from 'vite-plugin-monkey/dist/client';

const DMM_GRAPHQL_URL = 'https://api.video.dmm.co.jp/graphql';

const dmmGraphQLKeyword = (code) => {
    const match = String(code || '').trim().toUpperCase().match(/^([A-Z0-9]{2,10})-(\d{1,6})$/);
    if (!match) return '';
    return `${match[1].toLowerCase()}${match[2].padStart(5, '0')}`;
};

const dmmGraphQLRequest = (query) => {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'POST',
            url: DMM_GRAPHQL_URL,
            data: JSON.stringify({query}),
            timeout: 12000,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Referer: 'https://video.dmm.co.jp/',
                'Fanza-Device': 'BROWSER',
                'Cache-Control': 'no-cache',
            },
            onload: (response) => {
                if (response.status < 200 || response.status >= 400) {
                    reject(new Error(`DMM GraphQL HTTP ${response.status || 0}`));
                    return;
                }
                try {
                    const json = JSON.parse(response.responseText || '{}');
                    if (Array.isArray(json.errors) && json.errors.length) {
                        reject(new Error(json.errors[0].message || 'DMM GraphQL error'));
                        return;
                    }
                    resolve(json.data || {});
                } catch (e) {
                    reject(new Error(`DMM GraphQL JSON parse error: ${e.message}`));
                }
            },
            onerror: () => reject(new Error('DMM GraphQL network error')),
            ontimeout: () => reject(new Error('DMM GraphQL timeout')),
        });
    });
};

const loadDmmCover = async (code) => {
    const keyword = dmmGraphQLKeyword(code);
    if (!keyword) throw new Error('DMM cover keyword missing');

    const searchKeywords = [...new Set([keyword, `${keyword}#`])];
    for (const searchKeyword of searchKeywords) {
        const query = `{ legacySearchPPV(limit: 5, offset: 0, sort: SALES_RANK_SCORE, floor: AV, queryWord: ${JSON.stringify(searchKeyword)}) { result { contents { id } } } }`;
        const data = await dmmGraphQLRequest(query);

        const ids = Array.isArray(data && data.legacySearchPPV && data.legacySearchPPV.result && data.legacySearchPPV.result.contents)
            ? data.legacySearchPPV.result.contents.map((item) => String(item && item.id || '').trim()).filter(Boolean)
            : [];

        const compactKeyword = keyword.replace(/[^a-z0-9]/gi, '').toLowerCase();
        const contentID =
            ids.find((id) => id.replace(/[^a-z0-9]/gi, '').toLowerCase().includes(compactKeyword)) ||
            (ids.length === 1 ? ids[0] : '');

        if (contentID) {
            const encoded = encodeURIComponent(contentID);
            return `https://pics.dmm.co.jp/digital/video/${encoded}/${encoded}pl.jpg`;
        }
    }
    throw new Error('DMM cover missing');
};

const searchDmmContentIdsByGraphQL = async (code) => {
    const keyword = dmmGraphQLKeyword(code);
    if (!keyword) return [];
    const carNumNoHyphen = String(code || '').replace(/-/g, '').toLowerCase();

    const results = [];
    const searchKeywords = [...new Set([keyword, `${keyword}#`])];
    for (const searchKeyword of searchKeywords) {
        const query = `{ legacySearchPPV(limit: 10, offset: 0, sort: SALES_RANK_SCORE, floor: AV, queryWord: ${JSON.stringify(searchKeyword)}) { result { contents { contentId serviceCode floorCode } } } }`;
        const data = await dmmGraphQLRequest(query);

        const contents = Array.isArray(data && data.legacySearchPPV && data.legacySearchPPV.result && data.legacySearchPPV.result.contents)
            ? data.legacySearchPPV.result.contents
            : [];

        for (const item of contents) {
            const contentId = String(item.contentId || '');
            if (contentId.replace(/[^a-z0-9]/gi, '').toLowerCase().includes(carNumNoHyphen)) {
                results.push({
                    serviceCode: item.serviceCode || 'digital',
                    floorCode: item.floorCode || 'AV',
                    contentId: contentId,
                });
            }
        }
        if (results.length > 0) break;
    }
    return results;
};

const getDmmGraphQLVideoUrls = async (code) => {
    const contentItems = await searchDmmContentIdsByGraphQL(code);
    if (!contentItems.length) return null;

    const results = await Promise.allSettled(
        contentItems.map((item) => extractTrailerLinks(item))
    );

    for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
            return result.value;
        }
    }
    return null;
};

const extractTrailerLinks = (item) => {
    const {contentId, serviceCode, floorCode} = item;
    return new Promise((resolve, reject) => {
        const trailerPageUrl = `https://www.dmm.co.jp/service/digitalapi/-/html5_player/=/cid=${contentId}/mtype=AhRVShI_/service=${serviceCode}/floor=${floorCode}/mode=/`;

        GM_xmlhttpRequest({
            method: 'GET',
            url: trailerPageUrl,
            timeout: 15000,
            headers: {
                'accept-language': 'ja-JP,ja;q=0.9',
                Cookie: 'age_check_done=1',
            },
            onload: (response) => {
                const htmlContent = response.responseText || '';
                if (htmlContent.includes('このサービスはお住まいの地域からは')) {
                    reject(new Error('节点不可用，请将DMM域名分流到日本ip'));
                    return;
                }
                const match = htmlContent.match(/const\s+args\s+=\s+(.*);/);
                if (!match) {
                    reject(new Error('未在脚本中找到 const args = ... 变量'));
                    return;
                }
                let bitrates;
                try {
                    bitrates = JSON.parse(match[1]).bitrates;
                } catch (e) {
                    reject(new Error(`解析播放器脚本 JSON 失败: ${e.message}`));
                    return;
                }
                if (!Array.isArray(bitrates)) {
                    reject(new Error('解析画质链接失败: bitrates 字段不是一个数组或不存在'));
                    return;
                }
                const qualityKeys = [
                    '4ks', '4k', 'hhbs', 'hhb', 'hmb', 'mhb', 'mmb',
                    'dmb_w', 'dmb_s', 'dm_s', 'sm_s', 'mhb_w',
                ];
                const qualityNameRegex = new RegExp(`(${qualityKeys.join('|')})\\.mp4$`);
                const finalQualityMap = {};
                for (const bitrate of bitrates) {
                    const url = bitrate && bitrate.src;
                    if (!url || typeof url !== 'string' || !url.endsWith('.mp4')) continue;
                    const qualityMatch = url.match(qualityNameRegex);
                    let qualityKey = '';
                    if (qualityMatch && qualityMatch[1]) qualityKey = qualityMatch[1];
                    if (qualityKey && !finalQualityMap[qualityKey]) {
                        finalQualityMap[qualityKey] = url;
                    }
                }
                if (Object.keys(finalQualityMap).length === 0) {
                    reject(new Error('未找到匹配要求的预览画质视频'));
                    return;
                }
                resolve(finalQualityMap);
            },
            onerror: () => reject(new Error('DMM 播放页请求网络错误')),
            ontimeout: () => reject(new Error('DMM 播放页请求超时')),
        });
    });
};

export {
    DMM_GRAPHQL_URL,
    dmmGraphQLKeyword,
    dmmGraphQLRequest,
    loadDmmCover,
    searchDmmContentIdsByGraphQL,
    getDmmGraphQLVideoUrls,
    extractTrailerLinks,
};