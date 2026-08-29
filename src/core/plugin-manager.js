class PluginManager {
    constructor() {
        this.plugins = new Map;
    }
    register(pluginClass) {
        if ("function" != typeof pluginClass) throw new Error("插件必须是一个类");
        const instance = new pluginClass;
        instance.pluginManager = this;
        const lowerName = instance.getName();
        if (this.plugins.has(lowerName)) throw new Error(`插件"${name}"已注册`);
        this.plugins.set(lowerName, instance);
    }
    getBean(name2) {
        return this.plugins.get(name2);
    }
    async processCss() {
        const failedCssLoads = (await Promise.allSettled(Array.from(this.plugins).map((async ([name2, instance]) => {
            try {
                if ("function" == typeof instance.initCss) {
                    const css = await instance.initCss();
                    css && utils.insertStyle(css);
                    return {
                        name: name2,
                        status: "fulfilled"
                    };
                }
                return {
                    name: name2,
                    status: "skipped"
                };
            } catch (e) {
                console.error(`插件 ${name2} 加载 CSS 失败`, e);
                return {
                    name: name2,
                    status: "rejected",
                    error: e
                };
            }
        })))).filter((r => "rejected" === r.status));
        failedCssLoads.length && console.error("以下插件的 CSS 加载失败：", failedCssLoads.map((p => p.value.name)));
    }
    async processPlugins() {
        const failedPlugins = (await Promise.allSettled(Array.from(this.plugins).map((async ([name2, instance]) => {
            try {
                if ("function" == typeof instance.handle) {
                    await instance.handle();
                    return {
                        name: name2,
                        status: "fulfilled"
                    };
                }
            } catch (e) {
                clog.error(`插件 ${name2} 执行失败`, e);
                return {
                    name: name2,
                    status: "rejected",
                    error: e
                };
            }
        })))).filter((r => "rejected" === r.status));
        failedPlugins.length && console.error("以下插件执行失败：", failedPlugins.map((p => p.value.name)));
    }
}

export { PluginManager };