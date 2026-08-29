const apiUrl = "https://jdforrepam.com/api";

function buildSignature() {
    const curr = Math.floor(Date.now() / 1e3), stored_sign = localStorage.getItem("jhs_jdsignature");
    if (stored_sign) {
        const parts = stored_sign.split(".");
        if (3 === parts.length) {
            if (curr - parseInt(parts[0]) <= 300) return stored_sign;
        }
    }
    const sign = `${curr}.lpw6vgqzsp.${md5(`${curr}71cf27bb3c0bcdf207b64abecddc970098c7421ee7203b9cdae54478478a199e7d5a6e1a57691123c1a931c057842fb73ba3b3c83bcd69c17ccf174081e3d8aa`)}`;
    localStorage.setItem("jhs_jdsignature", sign);
    return sign;
}

const javDbApi = {
    getReviews: async (movieId, pageNum = 1, pageSize = 20) => {
        let url = `${apiUrl}/v1/movies/${movieId}/reviews`, headers = {
            jdSignature: await buildSignature()
        };
        return (await gmHttp.get(url, {
            page: pageNum,
            sort_by: "hotly",
            limit: pageSize
        }, headers)).data.reviews;
    },
    searchMovie: async keyword => {
        let url = `${apiUrl}/v2/search`, headers = {
            "user-agent": "Dart/3.5 (dart:io)",
            "accept-language": "zh-TW",
            host: "jdforrepam.com",
            jdsignature: await buildSignature()
        }, params = {
            q: keyword,
            page: 1,
            type: "movie",
            limit: 1,
            movie_type: "all",
            from_recent: "false",
            movie_filter_by: "all",
            movie_sort_by: "relevance"
        };
        return (await gmHttp.get(url, params, headers)).data.movies;
    },
    getMovieDetail: async movieId => {
        let url = `${apiUrl}/v4/movies/${movieId}`, headers = {
            jdSignature: await buildSignature()
        };
        const res = await gmHttp.get(url, null, headers);
        if (!res.data) {
            show.error("获取视频详情失败: " + res.message);
            throw new Error(res.message);
        }
        const movie = res.data.movie, preview_images = movie.preview_images, imgList = [];
        preview_images.forEach((item => {
            imgList.push(item.large_url.replace("https://tp.spfcas.com/rhe951l4q", "https://c0.jdbstatic.com"));

        }));
        return {
            movieId: movie.id,
            actors: movie.actors,
            duration: movie.duration,
            title: movie.origin_title,
            carNum: movie.number,
            score: movie.score,
            releaseDate: movie.release_date,
            watchedCount: movie.watched_count,
            imgList: imgList
        };
    },
    related: async (movieId, page = 1, limit = 20) => {
        let url = `${apiUrl}/v1/lists/related?movie_id=${movieId}&page=${page}&limit=${limit}`, headers = {
            jdSignature: await buildSignature()
        };
        const res = await gmHttp.get(url, null, headers), dataList = [];
        res.data.lists.forEach((item => {
            dataList.push({
                relatedId: item.id,
                name: item.name,
                movieCount: item.movies_count,
                collectionCount: item.collections_count,
                viewCount: item.views_count,
                createTime: utils.formatDate(item.created_at)
            });
        }));
        return dataList;
    },
    getMagnets: async movieId => {
        let url = `${apiUrl}/v1/movies/${movieId}/magnets`, headers = {
            jdSignature: await buildSignature()
        };
        return (await gmHttp.get(url, null, headers)).data.magnets;
    },
    playback: async (period = "daily", filter_by = "high_score") => {
        let url = `${apiUrl}/v1/rankings/playback?period=${period}&filter_by=${filter_by}`, headers = {
            jdSignature: await buildSignature()
        };
        return (await gmHttp.get(url, null, headers)).data.movies;
    },
    login: async (username, password) => {
        let url = `${apiUrl}/v1/sessions?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&device_uuid=04b9534d-5118-53de-9f87-2ddded77111e&device_name=iPhone&device_model=iPhone&platform=ios&system_version=17.4&app_version=official&app_version_number=1.9.29&app_channel=official`, headers = {
            "user-agent": "Dart/3.5 (dart:io)",
            "accept-language": "zh-TW",
            "content-type": "multipart/form-data; boundary=--dio-boundary-2210433284",
            jdsignature: await buildSignature()
        };
        return await gmHttp.post(url, null, headers);
    },
    top250: async (type = "all", type_value = "", page = 1, limit = 40) => {
        let url = `${apiUrl}/v1/movies/top?start_rank=1&type=${type}&type_value=${type_value}&ignore_watched=false&page=${page}&limit=${limit}`, headers = {
            "user-agent": "Dart/3.5 (dart:io)",
            "accept-language": "zh-TW",
            host: "jdforrepam.com",
            authorization: "Bearer " + localStorage.getItem("jhs_appAuthorization"),
            jdsignature: await buildSignature()
        };
        return await gmHttp.get(url, null, headers);
    },
    buildSignature: buildSignature,
    markDataListHtml: movies => {
        let moviesHtml = "";
        movies.forEach((movie => {
            moviesHtml += `\n            <div class="item" id="${movie.id}">\n                <a href="/v/${movie.id}" class="box" title="${movie.origin_title}">\n                    <div class="cover ">\n                        <img loading="lazy" src="${movie.cover_url.replace("https://tp.spfcas.com/rhe951l4q", "https://c0.jdbstatic.com")}" alt="">\n                    </div>\n                    <div class="video-title"><strong>${movie.number}</strong> ${movie.origin_title}</div>\n                    <div class="score" id="score_${movie.id}">\n                    </div>\n                    <div class="meta">\n                        ${movie.release_date}\n                    </div>\n                    <div class="tags has-addons">\n                       ${movie.has_cnsub ? '<span class="tag is-warning">含中字磁鏈</span>' : movie.magnets_count > 0 ? '<span class="tag is-success">含磁鏈</span>' : '<span class="tag is-info">无磁鏈</span>'}\n                       ${movie.new_magnets ? '<span class="tag is-info">今日新種</span>' : ""}\n                    </div>\n                </a>\n            </div>\n        `;
        }));
        return moviesHtml;
    }
};

export { javDbApi, buildSignature, apiUrl };