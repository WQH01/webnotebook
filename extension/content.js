// 标注持久化和详情弹窗增强

// 定义 CSS 变量
const CSS_VARIABLES = `
  :root {
    --primary-color: #007BFF;
    --secondary-color: #6C757D;
    --background-color: #FFFFFF;
    --text-color: #333333;
    --border-color: #DDDDDD;
    --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    --border-radius: 8px;
    --padding: 16px;
  }
`;

// 创建并插入 CSS 变量样式
const style = document.createElement('style');
style.textContent = CSS_VARIABLES;
document.head.appendChild(style);

// 获取页面唯一 key（忽略参数和锚点）
function getPageKey() {
    return window.location.origin + window.location.pathname;
}

// 检查是否为后台管理页面
function isAdminPage() {
    const url = window.location.href;
    return url.includes('localhost:3000') || url.includes('localhost:3001') || url.includes('/admin');
}

// 优化：分批高亮，避免阻塞主线程
function underlineTextBatch(text, color, noteId, tags) {
    if (!text || isAdminPage()) return; // 在后台管理页面不执行高亮
    // 先移除已有的下划线span，避免重复高亮和重复事件
    document.querySelectorAll('span[data-note-id="' + noteId + '"]').forEach(s => {
        s.replaceWith(document.createTextNode(s.textContent));
    });
    // 跨节点高亮实现：一次性收集所有匹配区间再包裹，避免递归导致节点错乱
    // 1. 收集所有可见文本节点
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    let fullText = '';
    let nodeStartIndexes = [];
    let idx = 0;
    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.parentNode || !node.nodeValue.trim()) continue;
        const tag = node.parentNode.nodeName.toLowerCase();
        if (["script", "style", "noscript", "textarea", "input"].includes(tag)) continue;
        nodeStartIndexes.push(idx);
        textNodes.push(node);
        fullText += node.nodeValue;
        idx += node.nodeValue.length;
    }
    // 2. 查找所有匹配区间
    let matchRanges = [];
    let searchIdx = 0;
    while (true) {
        const foundIdx = fullText.indexOf(text, searchIdx);
        if (foundIdx === -1) break;
        // 计算起止节点和偏移
        let startNodeIdx = 0, endNodeIdx = 0, startOffset = 0, endOffset = 0;
        for (let i = 0; i < nodeStartIndexes.length; i++) {
            if (nodeStartIndexes[i] <= foundIdx) startNodeIdx = i;
            if (nodeStartIndexes[i] <= foundIdx + text.length - 1) endNodeIdx = i;
        }
        startOffset = foundIdx - nodeStartIndexes[startNodeIdx];
        endOffset = foundIdx + text.length - nodeStartIndexes[endNodeIdx];
        matchRanges.push({ startNodeIdx, endNodeIdx, startOffset, endOffset });
        searchIdx = foundIdx + text.length;
    }
    // 3. 逆序包裹所有匹配，避免节点错位
    for (let k = matchRanges.length - 1; k >= 0; k--) {
        const { startNodeIdx, endNodeIdx, startOffset, endOffset } = matchRanges[k];
        const range = document.createRange();
        range.setStart(textNodes[startNodeIdx], startOffset);
        range.setEnd(textNodes[endNodeIdx], endOffset);
        const span = document.createElement('span');
        span.textContent = text;
        span.setAttribute('data-note-id', noteId || '');
        span.setAttribute('data-note-tags', tags || '');
        span.style.setProperty('text-decoration', 'underline', 'important');
        span.style.setProperty('text-decoration-color', color, 'important');
        span.style.cursor = 'pointer';
        span.style.color = color;
        span.addEventListener('mouseenter', function (e) {
            showSavedTooltip(span);
        });
        span.addEventListener('mouseleave', function (e) {
            hideSavedTooltip();
        });
        range.deleteContents();
        range.insertNode(span);
    }
}

// 恢复标注
function restoreHighlights() {
    if (isAdminPage()) return; // 在后台管理页面不执行恢复
    const url = getPageKey();
    try {
        chrome.storage.local.get([url], (result) => {
            if (chrome.runtime.lastError) {
                console.error('Storage error:', chrome.runtime.lastError);
                return;
            }
            if (result[url]) {
                result[url].forEach(note => {
                    underlineTextBatch(note.content, note.color, note.id, note.tags);
                });
            }
        });
    } catch (error) {
        console.error('Failed to restore highlights:', error);
    }
}

// 保存标注到 storage
function saveHighlightToStorage(note) {
    const url = getPageKey();
    try {
        chrome.storage.local.get([url], (result) => {
            if (chrome.runtime.lastError) {
                console.error('Storage error:', chrome.runtime.lastError);
                return;
            }
            const notes = result[url] || [];
            notes.push(note);
            chrome.storage.local.set({ [url]: notes }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Storage save error:', chrome.runtime.lastError);
                }
            });
        });
    } catch (error) {
        console.error('Failed to save highlight:', error);
    }
}

function createDialog(selectedText, pageUrl) {
    if (document.getElementById('webnotebook-dialog')) return;
    const dialog = document.createElement('div');
    dialog.id = 'webnotebook-dialog';
    dialog.style = `
      position: fixed;
      top: 20%;
      left: 50%;
      transform: translateX(-50%);
      background: var(--background-color);
      z-index: 99999;
      padding: var(--padding);
      border-radius: var(--border-radius);
      box-shadow: var(--box-shadow);
      border: 1px solid var(--border-color);
      font-family: Arial, sans-serif;
      color: var(--text-color);
    `;
    dialog.innerHTML = `
    <div style="font-size: 20px; font-weight: bold; margin-bottom: 12px;">保存为笔记</div>
    <div style="margin-bottom: 12px;">选中文本：<div style="background: #f5f5f5; padding: 8px; border-radius: 4px;">${selectedText}</div></div>
    <div style="margin-bottom: 12px;">下划线颜色：<input type="color" id="note-color" value="#ff0000" style="border: 1px solid var(--border-color); border-radius: 4px;"></div>
    <div style="margin-bottom: 16px;">标签/备注：<input type="text" id="note-tags" placeholder="可选" style="border: 1px solid var(--border-color); border-radius: 4px; padding: 6px;"></div>
    <button id="note-save-btn" style="background: var(--primary-color); color: white; border: none; border-radius: 4px; padding: 8px 16px; margin-right: 8px; cursor: pointer;">保存</button>
    <button id="note-cancel-btn" style="background: var(--secondary-color); color: white; border: none; border-radius: 4px; padding: 8px 16px; cursor: pointer;">取消</button>
  `;
    document.body.appendChild(dialog);

    document.getElementById('note-cancel-btn').onclick = () => dialog.remove();
    document.getElementById('note-save-btn').onclick = async () => {
        const color = document.getElementById('note-color').value;
        const tags = document.getElementById('note-tags').value;
        chrome.storage.local.get('webnotebook_token', async (result) => {
            const token = result.webnotebook_token;
            console.log('token used for save:', token);
            const res = await fetch('http://localhost:3001/api/notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    content: selectedText,
                    url: pageUrl,
                    color,
                    tags
                })
            });
            try {
                const data = await res.json();
                console.log('save response:', res.status, data);
                if (res.ok) {
                    dialog.remove();
                    underlineTextBatch(selectedText, color, data.id, tags);
                    saveHighlightToStorage({ id: data.id, content: selectedText, color, tags });
                    showSuccessToast('笔记保存成功！');
                } else {
                    alert('保存失败，请先登录！');
                }
            } catch (error) {
                console.error('Error parsing response as JSON:', error);
                alert('保存失败，请先登录！');
            }
        });
    };
}

function showNoteDetail(content, color, tags) {
    const detail = document.createElement('div');
    detail.style = `
      position: fixed;
      top: 30%;
      left: 50%;
      transform: translateX(-50%);
      background: var(--background-color);
      z-index: 99999;
      padding: var(--padding);
      border-radius: var(--border-radius);
      box-shadow: var(--box-shadow);
      border: 1px solid var(--border-color);
      font-family: Arial, sans-serif;
      color: var(--text-color);
    `;
    detail.innerHTML = `
    <div style="font-size: 20px; font-weight: bold; margin-bottom: 12px;">笔记详情</div>
    <div style="margin-bottom: 12px;">内容：<div style="background: #f5f5f5; padding: 8px; border-radius: 4px;">${content}</div></div>
    <div style="margin-bottom: 12px;">颜色：<span style="color:${color}">${color}</span></div>
    <div style="margin-bottom: 16px;">标签/备注：${tags || '无'}</div>
    <button id="note-detail-close" style="background: var(--secondary-color); color: white; border: none; border-radius: 4px; padding: 8px 16px; cursor: pointer;">关闭</button>
  `;
    document.body.appendChild(detail);
    document.getElementById('note-detail-close').onclick = () => detail.remove();
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!isExtensionContextValid()) {
        console.warn('Extension context is invalid, ignoring message');
        return;
    }

    if (msg.action === 'showNoteDialog') {
        createDialog(msg.selection, msg.pageUrl);
    }
});

// 新增：同步后端笔记到本地
async function syncNotesFromServer(token) {
    const url = getPageKey();
    try {
        const res = await fetch('http://localhost:3001/api/notes?url=' + encodeURIComponent(url), {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) return;
        const notes = await res.json();
        // 只存储本页面的笔记
        chrome.storage.local.set({ [url]: notes });
    } catch (e) {
        // 网络错误等忽略
    }
}

// 新增：检查扩展上下文是否有效
function isExtensionContextValid() {
    try {
        // 尝试访问chrome.runtime.id，如果扩展上下文无效会抛出错误
        return Boolean(chrome.runtime && chrome.runtime.id);
    } catch (e) {
        return false;
    }
}

// 修改 safeRestoreHighlights 函数
function safeRestoreHighlights() {
    if (!isExtensionContextValid()) {
        console.warn('Extension context is invalid');
        return;
    }

    try {
        chrome.storage.local.get('webnotebook_token', async (result) => {
            if (chrome.runtime.lastError) {
                console.error('Token retrieval error:', chrome.runtime.lastError);
                return;
            }
            const token = result.webnotebook_token;
            if (!token) {
                removeAllNoteUnderlines();
                return;
            }
            await syncNotesFromServer(token);
            restoreHighlights();
        });
    } catch (error) {
        console.error('Failed to safely restore highlights:', error);
    }
}

// 新增：移除所有下划线
function removeAllNoteUnderlines() {
    document.querySelectorAll('span[data-note-id]').forEach(s => {
        s.replaceWith(document.createTextNode(s.textContent));
    });
}

// 页面初次加载
window.addEventListener('DOMContentLoaded', safeRestoreHighlights);

// DOM 变化时
const observer = new MutationObserver(() => {
    safeRestoreHighlights();
});
observer.observe(document.body, { childList: true, subtree: true });

// 替换 alert('笔记保存成功！') 为自定义美观提示
function showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style = `
      position: fixed;
      top: 40px;
      left: 50%;
      transform: translateX(-50%);
      background: #4caf50;
      color: #fff;
      padding: 14px 32px;
      border-radius: 8px;
      font-size: 18px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.15);
      z-index: 999999;
      opacity: 0.98;
      font-family: Arial, sans-serif;
      pointer-events: none;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.transition = 'opacity 0.5s';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 2000);
}

// 悬停提示框实现
let savedTooltipEl = null;
function showSavedTooltip(targetSpan) {
    hideSavedTooltip();
    savedTooltipEl = document.createElement('div');
    savedTooltipEl.textContent = '已保存';
    savedTooltipEl.style = `
      position: absolute;
      background: #4caf50;
      color: #fff;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
      z-index: 999999;
      pointer-events: none;
      white-space: nowrap;
      opacity: 0.98;
      top: 0; left: 0;
      transition: opacity 0.2s;
    `;
    document.body.appendChild(savedTooltipEl);
    // 定位到 span 上方
    const rect = targetSpan.getBoundingClientRect();
    savedTooltipEl.style.left = (window.scrollX + rect.left + rect.width / 2 - savedTooltipEl.offsetWidth / 2) + 'px';
    savedTooltipEl.style.top = (window.scrollY + rect.top - 32) + 'px';
    // 重新定位，防止宽度为0
    setTimeout(() => {
        if (!savedTooltipEl) return;
        savedTooltipEl.style.left = (window.scrollX + rect.left + rect.width / 2 - savedTooltipEl.offsetWidth / 2) + 'px';
    }, 0);
}
function hideSavedTooltip() {
    if (savedTooltipEl) {
        savedTooltipEl.remove();
        savedTooltipEl = null;
    }
}

// 监听 token 变化，登录后自动高亮笔记
chrome.storage.onChanged.addListener(function (changes, area) {
    if (area === 'local' && changes.webnotebook_token) {
        // token 新增或变化，自动恢复高亮
        safeRestoreHighlights();
    }
});