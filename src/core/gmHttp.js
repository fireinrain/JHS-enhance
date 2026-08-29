import { GM_xmlhttpRequest } from 'vite-plugin-monkey/dist/client';

class GmHttp {
    async get(url, params = {}, headers = {}, noRedirect) {
        return this.gmRequest("GET", url, null, params, headers, noRedirect);
    }
    post(url, data = {}, headers = {}) {
        headers = {
            "Content-Type": "application/json",
            ...headers
        };
        let jsonData = JSON.stringify(data);
        return this.gmRequest("POST", url, jsonData, null, headers);
    }
    postForm(url, data = {}, headers = {}) {
        headers || (headers = {});
        headers["Content-Type"] || (headers["Content-Type"] = "application/x-www-form-urlencoded");
        let body = "";
        data && Object.keys(data).length > 0 && (body = Object.entries(data).map((([key, value]) => `${key}=${value}`)).join("&"));
        return this.gmRequest("POST", url, body, null, headers);
    }
    postFileFormData(url, data = {}, headers = {}) {
        headers || (headers = {});
        const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
        headers["Content-Type"] = `multipart/form-data; boundary=${boundary}`;
        let body = "";
        data && Object.keys(data).length > 0 && (body = Object.entries(data).map((([key, value]) => `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`)).join(""));
        body += `--${boundary}--`;
        return this.gmRequest("POST", url, body, null, headers);
    }
    async downloadFileInChunks(url, headers = {}) {
        const httpTimeout = await storageManager.getSetting("httpTimeout", 5e3), httpRetryCount = await storageManager.getSetting("httpRetryCount", 3);
        clog.log("正在获取文件大小...");
        let fileSize, mimeType;
        try {
            const sizeResponse = await utils.retry((() => new Promise(((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: url,
                    headers: {
                        ...headers,
                        Range: "bytes=0-0"
                    },
                    timeout: httpTimeout,
                    onload: resolve,
                    onerror: e => reject(new Error("网络错误：无法获取文件大小")),
                    ontimeout: () => reject(new Error("超时：获取文件大小"))
                });
            }))), httpRetryCount);
            if (206 !== sizeResponse.status && 200 !== sizeResponse.status) throw new Error(`请求文件大小失败，状态码: ${sizeResponse.status}`);
            {
                const rangeHeader = sizeResponse.responseHeaders.match(/content-range:\s*bytes\s*\d+-\d+\/(\d+)/i), typeHeader = sizeResponse.responseHeaders.match(/content-type:\s*([^\s;]+)/i);
                if (rangeHeader && rangeHeader[1]) fileSize = parseInt(rangeHeader[1], 10); else {
                    if (!sizeResponse.responseHeaders.match(/content-length:\s*(\d+)/i) || 200 !== sizeResponse.status) throw new Error("无法从响应头中获取文件总大小，服务器可能不支持 Range 请求。");
                    {
                        const lengthHeader = sizeResponse.responseHeaders.match(/content-length:\s*(\d+)/i);
                        fileSize = parseInt(lengthHeader[1], 10);
                        clog.warn("服务器返回 200 状态码，可能不支持 Range 请求。将尝试完整下载。");
                    }
                }
                typeHeader && typeHeader[1] && (mimeType = typeHeader[1]);
                clog.log(`文件总大小：${(fileSize / 1024 / 1024).toFixed(2)} MB, MIME 类型: ${mimeType || "未知"}`);
            }
        } catch (e) {
            clog.error("获取文件大小失败:", e.message);
            throw e;
        }
        if (!fileSize || fileSize <= 0) throw new Error("获取到的文件大小无效或服务器拒绝提供大小信息。");
        const numChunks = Math.ceil(fileSize / 1048576), chunkPromises = [], downloadedChunks = new Array(numChunks);
        clog.log(`文件将被分为 ${numChunks} 块进行下载 (每块约 ${1..toFixed(2)} MB)`);
        for (let i = 0; i < numChunks; i++) {
            const start = 1048576 * i, rangeHeader = `bytes=${start}-${Math.min(start + 1048576 - 1, fileSize - 1)}`, chunkPromise = await utils.retry((() => new Promise(((resolve, reject) => {
                const currentHeaders = {
                    ...headers,
                    Range: rangeHeader,
                    Accept: "application/octet-stream"
                };
                GM_xmlhttpRequest({
                    method: "GET",
                    url: url,
                    headers: currentHeaders,
                    timeout: httpTimeout,
                    responseType: "arraybuffer",
                    onload: response => {
                        if (206 === response.status || 200 === response.status) if (response.response instanceof ArrayBuffer) {
                            downloadedChunks[i] = response.response;
                            clog.log(`成功下载第 ${i + 1}/${numChunks} 块 (${rangeHeader})`);
                            resolve();
                        } else reject(new Error(`第 ${i + 1} 块响应不是 ArrayBuffer。`)); else reject(new Error(`第 ${i + 1} 块请求失败，状态码: ${response.status}`));
                    },
                    onerror: error => reject(new Error(`第 ${i + 1} 块网络错误: ${error.error}`)),
                    ontimeout: () => reject(new Error(`第 ${i + 1} 块超时。`))
                });
            }))), httpRetryCount);
            chunkPromises.push(chunkPromise);
        }
        try {
            await Promise.all(chunkPromises);
            clog.log("所有分块下载完成，开始合并...");
        } catch (e) {
            clog.error("分块下载过程中发生错误:", e.message);
            throw e;
        }
        const finalBlob = new Blob(downloadedChunks);
        finalBlob.size !== fileSize && clog.warn(`警告：合并后的 Blob 大小 (${finalBlob.size}) 与预期文件大小 (${fileSize}) 不匹配！`);
        return await finalBlob.text();
    }
    async gmRequest(method, url, data = {}, params = {}, headers = {}, noRedirect = !1) {
        if (params && Object.keys(params).length) {
            const queryString = new URLSearchParams(params).toString();
            url += (url.includes("?") ? "&" : "?") + queryString;
        }
        const httpTimeout = await storageManager.getSetting("httpTimeout", 5e3), httpRetryCount = await storageManager.getSetting("httpRetryCount", 3);
        data || (data = void 0);
        return await utils.retry((() => new Promise(((resolve, reject) => {
            GM_xmlhttpRequest({
                method: method,
                url: url,
                headers: headers,
                timeout: httpTimeout,
                data: data,
                onload: response => {
                    try {
                        noRedirect && response.finalUrl !== url && reject("请求被重定向了,URL是:" + response.finalUrl);
                        if (response.status >= 200 && response.status < 300) if (response.responseText) try {
                            resolve(JSON.parse(response.responseText));
                        } catch (e) {
                            resolve(response.responseText);
                        } else resolve(response.responseText || response); else {
                            clog.error("请求失败,状态码:", response.status, url);
                            if (response.responseText) try {
                                const errorData = JSON.parse(response.responseText);
                                reject(errorData);
                            } catch {
                                reject(new Error(response.responseText || `请求发生错误 ${response.status}`));
                            } else reject(new Error(`请求发生错误 ${response.status}`));
                        }
                    } catch (e) {
                        reject(e);
                    }
                },
                onerror: error => {
                    clog.error("网络错误:", url);
                    reject(new Error(error.error || "网络错误"));
                },
                ontimeout: () => {
                    reject(new Error("请求超时: " + url));
                }
            });
        }))), httpRetryCount);
    }
}

export { GmHttp };