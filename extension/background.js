chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "saveAsNote",
        title: "保存为笔记",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "saveAsNote") {
        chrome.tabs.sendMessage(tab.id, {
            action: "showNoteDialog",
            selection: info.selectionText,
            pageUrl: info.pageUrl
        });
    }
}); 