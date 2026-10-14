import {BasePlugin} from '../core/base-plugin.js';
import {insertStyle} from '../core/constants.js';

class ArticlePagePlugin extends BasePlugin {
    getName() {
        return "ArticlePagePlugin";
    }

    handle() {
        const href = window.location.href;
        if (!href.includes("/articles")) {
            return;
        }
        this.optimizeArticleLayout();
        this.bindClick();
    }

    bindClick() {
        // 使用 MutationObserver 监听 DOM 变化，尽早绑定事件
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                    this.attachClickHandler();
                    break;
                }
            }
        });

        // 立即尝试绑定一次
        this.attachClickHandler();

        // 监听整个 document 的 DOM 变化
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    attachClickHandler() {
        const $articleList = $('.article-list');
        if ($articleList.length === 0) return;

        // 检查是否已经绑定过
        if ($articleList.data('click-bound')) return;
        $articleList.data('click-bound', true);

        // 方法1：移除所有 a 标签的 href 属性，从根本上阻止跳转
        $articleList.find('a').each(function () {
            const $a = $(this);
            const href = $a.attr('href');
            if (href) {
                $a.attr('data-href', href).removeAttr('href');
                $a.css('cursor', 'pointer');
            }
        });

        // 方法2：使用事件捕获阶段绑定（优先级最高）
        document.querySelector('.article-list').addEventListener('click', (e) => {
            // 简化选择器，closest 不支持 > div 这样的子选择器
            let target = e.target.closest('.article-item, a, [data-href]');

            // 如果没找到，尝试向上找 .article-list 的直接子元素
            if (!target) {
                let el = e.target;
                const articleList = document.querySelector('.article-list');
                while (el && el !== articleList) {
                    if (el.parentElement === articleList) {
                        target = el;
                        break;
                    }
                    el = el.parentElement;
                }
            }

            if (!target) return;

            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            const $target = $(target);
            const $link = $target.find('a[data-href]').first().length > 0
                ? $target.find('a[data-href]').first()
                : $target.closest('a[data-href]');

            const articleUrl = $link.attr('data-href') || $target.attr('data-href');
            if (!articleUrl) return;

            layer.open({
                type: 2,
                title: $target.text().trim().substring(0, 50) || '文章详情',
                content: articleUrl,
                area: ['80%', '85%'],
                shadeClose: true,
                maxmin: true,
                scrollbar: false
            });

            return false;
        }, true); // true = 捕获阶段，优先级最高
    }

    optimizeArticleLayout() {
        const css = `
            /* 文章列表容器改为 grid 布局，每行3个 */
            .article-list {
                display: grid !important;
                grid-template-columns: repeat(3, 1fr) !important;
                gap: 20px !important;
            }
            /* 每个文章卡片改为纵向布局 */
            .article-list > div {
                display: flex !important;
                flex-direction: column !important;
                overflow: hidden !important;
                border-radius: 8px !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
                transition: transform 0.2s, box-shadow 0.2s !important;
                background: #fff !important;
            }
            .article-list > div:hover {
                transform: translateY(-4px) !important;
                box-shadow: 0 4px 16px rgba(0,0,0,0.15) !important;
            }
            /* 封面图片 */
            .article-list > div img {
                width: 100% !important;
                height: auto !important;
                aspect-ratio: 3/4 !important;
                object-fit: cover !important;
                border-radius: 8px 8px 0 0 !important;
                display: block !important;
            }
            /* 内容区域 */
            .article-list > div > div:not(:first-child) {
                padding: 12px !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 8px !important;
            }
            /* 标题完全显示，不截断 */
            .article-list > div > a,
            .article-list > div > h3,
            .article-list > div > p {
                font-size: 14px !important;
                line-height: 1.5 !important;
                display: block !important;
                overflow: visible !important;
                text-overflow: clip !important;
                -webkit-line-clamp: unset !important;
                -webkit-box-orient: unset !important;
                min-height: unset !important;
                color: #333 !important;
                word-break: break-word !important;
            }
            /* 底部信息 */
            .article-list > div > div:last-child {
                margin-top: auto !important;
                font-size: 12px !important;
                color: #999 !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
            }
            /* 标签 */
            .article-list > div span[class*="tag"],
            .article-list > div span[class*="label"] {
                background: #f0f0f0 !important;
                padding: 2px 8px !important;
                border-radius: 4px !important;
                font-size: 11px !important;
            }
        `;
        insertStyle(css);
    }
}

export {ArticlePagePlugin};