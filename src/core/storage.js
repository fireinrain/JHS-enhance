import { __privateMethod, __publicField, __typeError } from './constants.js';

var _StorageManager_instances, setItem_fn, saveFilterItem_fn;

_StorageManager_instances = new WeakSet;

setItem_fn = async function(key, data) {
    key === this.favorite_actresses_key && window.clean_cacheFavoriteActressList();
    key === this.blacklist_car_list_key && window.clean_cacheBlacklistCarList();
    key === this.setting_key && window.clean_cacheSettingObj();
    key === this.car_list_key && window.clean_cacheCarList();
    await this.forage.setItem(key, data);
};

saveFilterItem_fn = async function(items, storageKey, itemName) {
    let itemList;
    if (Array.isArray(items)) itemList = [ ...items ]; else {
        itemList = await this.forage.getItem(storageKey) || [];
        if (itemList.includes(items)) {
            const errorMsg = `${items} ${itemName}已存在`;
            show.error(errorMsg);
            throw new Error(errorMsg);
        }
        itemList.push(items);
    }
    await __privateMethod(this, _StorageManager_instances, setItem_fn).call(this, storageKey, itemList);
    return itemList;
};

let StorageManager = class _StorageManager {
    constructor() {
        obj = this, (member = _StorageManager_instances).has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
        var obj, member, value;
        __publicField(this, "car_list_key", "car_list");
        __publicField(this, "filter_keyword_title_key", "filter_keyword_title");
        __publicField(this, "filter_keyword_review_key", "filter_keyword_review");
        __publicField(this, "setting_key", "setting");
        __publicField(this, "blacklist_key", "blacklist");
        __publicField(this, "blacklist_car_list_key", "blacklist_car_list");
        __publicField(this, "favorite_actresses_key", "favorite_actresses");
        __publicField(this, "highlighted_tags_key", "highlighted_tags");
        __publicField(this, "forage", localforage.createInstance({
            driver: localforage.INDEXEDDB,
            name: "JAV-JHS",
            version: 1,
            storeName: "appData"
        }));
        __publicField(this, "cacheCarList", null);
        __publicField(this, "cacheBlacklistCarList", null);
        __publicField(this, "cacheFavoriteActressList", null);
        __publicField(this, "cacheSettingObj", null);
        if (_StorageManager.instance) throw new Error("StorageManager已被实例化过了!");
        _StorageManager.instance = this;
    }
    async getCarList() {
        if (this.cacheCarList) return utils.copyObj(this.cacheCarList);
        this.cacheCarList = await this.forage.getItem(this.car_list_key) || [];
        return utils.copyObj(this.cacheCarList);
    }
    async getCar(carNum2) {
        return (await this.getCarList()).find((item => item.carNum === carNum2));
    }
    _handleSingleCar(carParam, carList) {
        let {carNum: carNum2, url: url, names: names, actionType: actionType, publishTime: publishTime, starId: starId} = carParam;
        if (!carNum2) {
            show.error("番号为空!");
            throw new Error("番号为空!");
        }
        if (!url) {
            show.error("url为空!");
            throw new Error("url为空!");
        }
        url.includes("http") || (url = window.location.origin + url);
        names && (names = names.trim());
        let carData = carList.find((item => item.carNum === carNum2));
        if (carData) {
            names && (carData.names = names);
            url && (carData.url = url);
            publishTime && (carData.publishTime = publishTime);
            carData.updateDate = utils.getNowStr();
        } else {
            let nowStr = utils.getNowStr();
            carData = {
                carNum: carNum2,
                url: url,
                names: names,
                status: "",
                createDate: nowStr,
                updateDate: nowStr,
                publishTime: publishTime
            };
            starId && (carData.starId = starId);
            carList.push(carData);
        }
        switch (actionType) {
            case Status_FILTER:
                if (carData.status === Status_FILTER) {
                    const msg2 = `${carNum2} 已在屏蔽列表中`;
                    show.error(msg2);
                    throw new Error(msg2);
                }
                carData.status = Status_FILTER;
                break;

            case Status_FAVORITE:
                if (carData.status === Status_FAVORITE) {
                    const msg2 = `${carNum2} 已在收藏列表中`;
                    show.error(msg2);
                    throw new Error(msg2);
                }
                carData.status = Status_FAVORITE;
                break;

            case Status_HAS_DOWN:
                carData.status = Status_HAS_DOWN;
                break;

            case Status_HAS_WATCH:
                carData.status = Status_HAS_WATCH;
                break;

            default:
                const msg = "actionType错误, 请联系作者更正: " + actionType;
                show.error(msg);
                throw new Error(msg);
        }
    }
    async saveCar(carData) {
        const carList = await this.forage.getItem(this.car_list_key) || [];
        this._handleSingleCar(carData, carList);
        await __privateMethod(this, _StorageManager_instances, setItem_fn).call(this, this.car_list_key, carList);
        await this.removeNewVideoList([ carData.carNum ]);
    }
    async updateCarInfo(carParam) {
        let {carNum: carNum2, url: url, names: names, actionType: actionType, publishTime: publishTime, remark: remark} = carParam;
        if (!carNum2) {
            show.error("番号为空!");
            throw new Error("番号为空!");
        }
        if (!url) {
            show.error("url为空!");
            throw new Error("url为空!");
        }
        names && (names = names.trim());
        const carList = await this.forage.getItem(this.car_list_key) || [];
        let carData = carList.find((item => item.carNum === carNum2));
        if (!carData) {
            const msg = "数据不存在: " + carNum2;
            show.error(msg);
            throw new Error(msg);
        }
        carData.names = names;
        carData.url = url;
        carData.remark = remark;
        carData.updateDate = utils.getNowStr();
        switch (actionType) {
            case Status_FILTER:
                carData.status = Status_FILTER;
                break;

            case Status_FAVORITE:
                carData.status = Status_FAVORITE;
                break;

            case Status_HAS_DOWN:
                carData.status = Status_HAS_DOWN;
                break;

            case Status_HAS_WATCH:
                carData.status = Status_HAS_WATCH;
                break;

            default:
                const msg = "actionType错误, 请联系作者更正: " + actionType;
                show.error(msg);
                throw new Error(msg);
        }
        await __privateMethod(this, _StorageManager_instances, setItem_fn).call(this, this.car_list_key, carList);
    }
    async saveCarList(carRecords) {
        if (!carRecords || !Array.isArray(carRecords) || 0 === carRecords.length) {
            show.error("记录列表为空!");
            throw new Error("记录列表为空!");
        }
        const carList = await this.forage.getItem(this.car_list_key) || [];
        for (const record of carRecords) try {
            this._handleSingleCar(record, carList);
        } catch (error) {
            throw error;
        }
        await __privateMethod(this, _StorageManager_instances, setItem_fn).call(this, this.car_list_key, carList);
    }
    async removeNewVideoList(carNumList) {
        const favoriteActressesList = await this.getFavoriteActressList();
        let hasAnyListBeenModified = !1;
        const updatedActressList = favoriteActressesList.map((actress => {
            if (!actress.newVideoList || !Array.isArray(actress.newVideoList)) return actress;
            const newFilteredVideoList = actress.newVideoList.filter((carNumString => {
                const isRemoved = carNumList.includes(carNumString);
                if (isRemoved) {
                    clog.log("移除关联女优新作品", actress.name, carNumString);
                    hasAnyListBeenModified = !0;
                }
                return !isRemoved;
            }));
            return {
                ...actress,
                newVideoList: newFilteredVideoList
            };
        }));
        hasAnyListBeenModified && await __privateMethod(this, _StorageManager_instances, setItem_fn).call(this, this.favorite_actresses_key, updatedActressList);
    }
    async removeCar(carNum2) {
        const carList = await this.getCarList(), initialLength = carList.length, updatedList = carList.filter((car => car.carNum !== carNum2));
        if (updatedList.length === initialLength) {
            show.error(`${carNum2} 不存在`);
            return !1;
        }
        await __privateMethod(this, _StorageManager_instances, setItem_fn).call(this, this.car_list_key, updatedList);
        return !0;
    }
    async batchRemoveCars(carNumList) {
        if (!carNumList || 0 === carNumList.length) throw new Error("未传入参数");
        const carList = await this.getCarList(), initialLength = carList.length, carNumsSet = new Set(carNumList), updatedList = carList.filter((car => !carNumsSet.has(car.carNum))), removedCount = initialLength - updatedList.length;
        if (0 === removedCount) return removedCount;
        await __privateMethod(this, _StorageManager_instances, setItem_fn).call(this, this.car_list_key, updatedList);
        return removedCount;
    }
    async getBlacklist() {
        return await this.forage.getItem(this.blacklist_key) || [];
    }
    async addBlacklistItem(item) {
        let {starId: starId, name: name2, allName: allName, role: role, movieType: movieType, url: url} = item;
        if (!starId) throw new Error("缺失starId");
        if (!name2) throw new Error("缺失name");
        if (!role) throw new Error("缺失role");
        const blacklist = await this.getBlacklist(), existData = blacklist.find((item2 => item2.starId === starId));
        if (existData) {
            existData.url = url;
            existData.role = role;
            existData.movieType = movieType;
            clog.log("更新黑名单演员信息", existData);
        } else {
            const info = {
                starId: starId,
                name: name2,
                allName: allName || [ name2 ],
                createTime: utils.getNowStr(),
                role: role,
                movieType: movieType,
                url: url
            };
            blacklist.push(info);
            clog.log("增加黑名单演员信息", info);
        }
        await __privateMethod(this, _StorageManager_instances, setItem_fn).call(this, this.blacklist_key, blacklist);
    }
    async updateBlacklistItem(item) {
        if (!item || !item.starId) throw new Error("参数不全");
        const filterActorActressInfoList = await this.getBlacklist(), waitUpdateObj = filterActorActressInfoList.find((i => i.starId === item.starId));
        if (!waitUpdateObj) throw new Error(`未找到黑名单演员信息:${item.name} ${item.starId}`);
        item.checkTime && (waitUpdateObj.checkTime = item.checkTime);
        item.lastPublishTime && (waitUpdateObj.lastPublishTime = item.lastPublishTime);
        await __privateMethod(this, _StorageManager_instances, setItem_fn).call(this, this.blacklist_key, filterActorActressInfoList);
    }
    async deleteBlacklistItem(starId) {
        const blacklist = await this.getBlacklist(), updatedList = blacklist.filter((item => item.starId !== starId));
        blacklist.length !== updatedList.length && await __privateMethod(this, _StorageManager_instances, setItem_fn).call(this, this.blacklist_key, updatedList);
    }
    async getBlacklistCarList() {
        if (this.cacheBlacklistCarList && this.cacheBlacklistCarList.length > 0) return utils.deepFreeze(this.cacheBlacklistCarList);
        this.cacheBlacklistCarList = await this.forage.getItem(this.blacklist_car_list_key) || [];
        setTimeout((() => {
            utils.deepFreeze(this.cacheBlacklistCarList);
        }), 0);
        return this.cacheBlacklistCarList;
    }
    async batchSaveBlacklistCarList(carDataList) {
        const carList = await this.getCarList();
        let blacklistCarList = await this.getBlacklistCarList(), hasChanged = !1, copyBlacklistCarList = null, carNumList = [];
        for (const carData of carDataList) {
            let existBlacklistCarData = blacklistCarList.find((item => item.carNum === carData.carNum));
            if (existBlacklistCarData) {
                console.log("已在鉴定记录中", existBlacklistCarData);
                continue;
            }
            let existCarData = carList.find((item => item.carNum === carData.carNum));
            if (existCarData) console.log("已在鉴定记录中", existCarData); else {
                copyBlacklistCarList || (copyBlacklistCarList = utils.copyObj(blacklistCarList));
                this._handleSingleCar(carData, copyBlacklistCarList);
                clog.log(`屏蔽演员番号: <span style="color: #f40">${carData.names} ${carData.carNum}</span>`);
                hasChanged = !0;
                carNumList.push(carData.carNum);
            }
        }
        if (hasChanged) {
            if (!copyBlacklistCarList) throw new Error("程序异常, 黑名单番号数据对象为空!");
            await __privateMethod(this, _StorageManager_instances, setItem_fn).call(this, this.blacklist_car_list_key, copyBlacklistCarList);
            await this.removeNewVideoList(carNumList);
        }
    }
    async removeBlacklistCarList(starId) {
        const filterActorActressCarList = await this.getBlacklistCarList(), newList = filterActorActressCarList.filter((car => car.starId !== starId));
        newList.length !== filterActorActressCarList.length && await __privateMethod(this, _StorageManager_instances, setItem_fn).call(this, this.blacklist_car_list_key, newList);
    }
    async batchRemoveBlacklistCars(carNumList) {
        if (!carNumList || 0 === carNumList.length) throw new Error("未传入参数");
        const blacklistCarList = await this.getBlacklistCarList(), initialLength = blacklistCarList.length, carNumsSet = new Set(carNumList), updatedList = blacklistCarList.filter((car => !carNumsSet.has(car.carNum))), removedCount = initialLength - updatedList.length;
        if (0 === removedCount) return removedCount;
        await __privateMethod(this, _StorageManager_instances, setItem_fn).call(this, this.blacklist_car_list_key, updatedList);
        return removedCount;
    }
    async getFavoriteActressList() {
        if (this.cacheFavoriteActressList) return utils.copyObj(this.cacheFavoriteActressList);
        this.cacheFavoriteActressList = await this.forage.getItem(this.favorite_actresses_key) || [];
        return utils.copyObj(this.cacheFavoriteActressList);
    }
    async addFavoriteActressList(actressList) {
        const favoriteActressesInfoList = await this.getFavoriteActressList();
        let resultCount = 0;
        for (const actress of actressList) {
            let {starId: starId, name: name2, allName: allName, avatar: avatar, lastCheckTime: lastCheckTime, lastPublishTime: lastPublishTime, actressType: actressType} = actress;
            if (!starId) throw new Error("缺失starId");
            if (!name2) throw new Error("缺失name");
            allName || (allName = [ name2 ]);
            const uncensoredText = "(無碼)";
            if (!actressType) {
                actressType = name2.includes(uncensoredText) || allName.some((element => element.includes(uncensoredText))) ? "uncensored" : "censored";
            }
            name2 = name2.replace(uncensoredText, "");
            allName = allName.map((n => n.replace(uncensoredText, "")));
            let favoriteActresses = favoriteActressesInfoList.find((item => item.starId === starId));
            if (favoriteActresses) {
                if ((!favoriteActresses.avatar || !favoriteActresses.avatar.includes("https")) && avatar) {
                    clog.log(avatar);
                    favoriteActresses.avatar = avatar;
                    clog.log(`<span style="color: #f40">补全女优头像: ${name2}</span>`);
                    resultCount++;
                }
                if (!favoriteActresses.actressType && actressType) {
                    favoriteActresses.actressType = actressType;
                    clog.log(`<span style="color: #f40">补全女优类别: ${name2} ${actressType}</span>`);
                    resultCount++;
                }
                if (favoriteActresses.name.includes(uncensoredText)) {
                    favoriteActresses.name = name2;
                    favoriteActresses.allName = allName;
                    clog.log(`<span style="color: #f40">更正女优名字: ${name2} ${allName}</span>`);
                    resultCount++;
                }
                continue;
            }
            const nowStr = utils.getNowStr();
            favoriteActressesInfoList.push({
                starId: starId,
                name: name2,
                allName: allName,
                avatar: avatar,
                lastCheckTime: lastCheckTime,
                lastPublishTime: lastPublishTime,
                createDate: nowStr,
                updateDate: nowStr,
                actressType: actressType
            });
            clog.log(`<span style="color: #f40">同步JavDB已收藏的演员: ${name2}</span>`);
            resultCount++;
        }
        resultCount > 0 ? await __privateMethod(this, _StorageManager_instances, setItem_fn).call(this, this.favorite_actresses_key, favoriteActressesInfoList) : clog.log("信息已记录, 无需要进行同步收藏的演员");
        return resultCount;
    }
    async removeFavoriteActress(starId) {
        const favoriteActressesInfoList = await this.getFavoriteActressList(), initialLength = favoriteActressesInfoList.length, updatedList = favoriteActressesInfoList.filter((car => car.starId !== starId));
        if (updatedList.length === initialLength) {
            clog.error(`移除演员失败, ${starId} 不存在`);
            return !1;
        }
        await __privateMethod(this, _StorageManager_instances, setItem_fn).call(this, this.favorite_actresses_key, updatedList);
        return !0;
    }
    async updateFavoriteActress(actress) {
        const favoriteActressesInfoList = await this.getFavoriteActressList(), {starId: starId, name: name2, allName: allName, avatar: avatar, lastCheckTime: lastCheckTime, newVideoList: newVideoList, lastPublishTime: lastPublishTime, actressType: actressType, remark: remark} = actress;
        if (!starId) throw new Error("缺失starId");
        let favoriteActresses = favoriteActressesInfoList.find((item => item.starId === starId));
        if (!favoriteActresses) {
            clog.error("未找到演员信息", starId, name2);
            return !1;
        }
        name2 && (favoriteActresses.name = name2);
        allName && (favoriteActresses.allName = allName);
        avatar && (favoriteActresses.avatar = avatar);
        null != actressType && (favoriteActresses.actressType = actressType);
        lastCheckTime && (favoriteActresses.lastCheckTime = lastCheckTime);
        newVideoList && (favoriteActresses.newVideoList = newVideoList);
        lastPublishTime && (favoriteActresses.lastPublishTime = lastPublishTime);
        remark && (favoriteActresses.remark = remark);
        favoriteActresses.updateDate = utils.getNowStr();
        await __privateMethod(this, _StorageManager_instances, setItem_fn).call(this, this.favorite_actresses_key, favoriteActressesInfoList);
    }
    async getHighlightedTags() {
        return await this.forage.getItem(this.highlighted_tags_key) || [];
    }
    async setHighlightedTags(highlightedTags) {
        return await __privateMethod(this, _StorageManager_instances, setItem_fn).call(this, this.highlighted_tags_key, highlightedTags);
    }
    async saveTitleFilterKeyword(keywords) {
        await __privateMethod(this, _StorageManager_instances, saveFilterItem_fn).call(this, keywords, this.filter_keyword_title_key, "标题关键词");
        if (Array.isArray(keywords)) return null;
        const favoriteActressesList = await this.getFavoriteActressList();
        let hasAnyListBeenModified = !1;
        const updatedActressList = favoriteActressesList.map((actress => {
            if (!actress.newVideoList || !Array.isArray(actress.newVideoList)) return actress;
            const newFilteredVideoList = actress.newVideoList.filter((carNumString => {
                const isRemoved = carNumString.startsWith(keywords);
                if (isRemoved) {
                    clog.log("移除关联女优新作品", actress.name, carNumString);
                    hasAnyListBeenModified = !0;
                }
                return !isRemoved;
            }));
            return {
                ...actress,
                newVideoList: newFilteredVideoList
            };
        }));
        hasAnyListBeenModified && await __privateMethod(this, _StorageManager_instances, setItem_fn).call(this, this.favorite_actresses_key, updatedActressList);
    }
    async getTitleFilterKeyword() {
        return await this.forage.getItem(this.filter_keyword_title_key) || [];
    }
    async getReviewFilterKeywordList() {
        return await this.forage.getItem(this.filter_keyword_review_key) || [];
    }
    async saveReviewFilterKeyword(keywords) {
        return __privateMethod(this, _StorageManager_instances, saveFilterItem_fn).call(this, keywords, this.filter_keyword_review_key, "评论关键词");
    }
    async getSetting(attribute = null, defaultVal) {
        this.cacheSettingObj || (this.cacheSettingObj = await this.forage.getItem(this.setting_key) || {});
        let settingObj = utils.copyObj(this.cacheSettingObj);
        if (null === attribute) return settingObj;
        const value = settingObj[attribute];
        return value ? "true" === value || "false" === value ? "true" === value.toLowerCase() : "string" != typeof value || "" === value.trim() || isNaN(Number(value)) ? value : Number(value) : defaultVal;
    }
    async saveSetting(settingObj) {
        settingObj ? await __privateMethod(this, _StorageManager_instances, setItem_fn).call(this, this.setting_key, settingObj) : show.error("设置对象为空");
    }
    async saveSettingItem(key, value) {
        if (!key) {
            show.error("key 不能为空");
            return;
        }
        let settingObj = await this.getSetting();
        settingObj[key] = value;
        await this.saveSetting(settingObj);
    }
    async importData(jsonData) {
        await this.forage.clear();
        const importPromises = [];
        for (const key in jsonData) {
            const value = jsonData[key], setPromise = __privateMethod(this, _StorageManager_instances, setItem_fn).call(this, key, value);
            importPromises.push(setPromise);
        }
        await Promise.all(importPromises);
    }
    async exportData() {
        const dataMap = {};
        await this.forage.iterate(((value, key) => {
            dataMap[key] = value;
        }));
        if (0 === Object.keys(dataMap).length) throw new Error("没有可导出的数据");
        return dataMap;
    }
};

export { StorageManager };