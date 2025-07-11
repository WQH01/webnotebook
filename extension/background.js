// 创建右键菜单
chrome.contextMenus.create({
    id: 'save-note',
    title: '保存为笔记',
    contexts: ['selection'],
    documentUrlPatterns: [
        'http://*/*',
        'https://*/*',
        'file:///*'
    ]
});

// 排除后台管理页面的URL
const excludePatterns = [
    '*://localhost:3000/*',
    '*://localhost:3001/*',
    '*://*/admin*'
];

// 监听标签页更新，根据URL控制右键菜单的显示
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        const isAdminPage = excludePatterns.some(pattern => {
            return new RegExp('^' + pattern.replace(/\*/g, '.*') + '$').test(tab.url);
        });

        // 在后台管理页面禁用右键菜单
        chrome.contextMenus.update('save-note', {
            enabled: !isAdminPage
        });
    }
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'save-note') {
        chrome.tabs.sendMessage(tab.id, {
            action: 'showNoteDialog',
            selection: info.selectionText,
            pageUrl: tab.url
        });
    }
}); 