const COVER_API_URL = [77, 81, 81, 85, 86, 31, 10, 10, 68, 85, 76, 8, 65, 72, 72, 87, 86, 70, 11, 20, 22, 20, 17, 22, 22, 11, 93, 92, 95, 10, 68, 85, 76, 10, 70, 74, 83, 64, 87]
    .map(v => String.fromCharCode(v ^ 0x25)).join('');

const COVER_API_TOKEN = [18, 28, 19, 19, 65, 65, 70, 28, 64, 29, 23, 21, 17, 29, 67, 70, 18, 64, 21, 22, 64, 16, 65, 29, 22, 19, 16, 28, 16, 17, 64, 29]
    .map(v => String.fromCharCode(v ^ 0x25)).join('');

const getCover = async (code) => {
    const query = String(code || '').trim();
    if (!query) return null;

    try {
        const r = await gmHttp.get(`${COVER_API_URL}/${encodeURIComponent(query)}`, null, {
            'Authorization': `Bearer ${COVER_API_TOKEN}`,
        }, {timeout: 15000});

        if (r?.cover?.large) {
            //clog.log('高清封面地址:', r.cover.large);
            return r.cover.large;
        }
        return null;
    } catch (e) {
        clog.error('获取封面失败:', e.message);
        return null;
    }
};

export {getCover};