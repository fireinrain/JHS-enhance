import { BasePlugin } from '../core/base-plugin.js';
import { __publicField } from '../core/constants.js';

class AliyunPanPlugin extends BasePlugin {
    getName() {
        return "AliyunPanPlugin";
    }
    handle() {
        $("body").append('<a class="a-success" id="refresh-token-btn" style="position:fixed; right: 0; top:50%;z-index:99999">获取refresh_token</a>');
        $("#refresh-token-btn").on("click", (event => {
            let tokenStr = localStorage.getItem("token");
            if (!tokenStr) {
                alert("请先登录!");
                return;
            }
            let refresh_token = JSON.parse(tokenStr).refresh_token;
            navigator.clipboard.writeText(refresh_token).then((() => {
                alert("已复制到剪切板 如失败, 请手动复制: " + refresh_token);
            })).catch((err => {
                console.error("Failed to copy refresh token: ", err);
            }));
        }));
    }
}


export { AliyunPanPlugin };
