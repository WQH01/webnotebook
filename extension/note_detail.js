// 获取 URL 参数
function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

// 格式化日期时间
function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

// 转义HTML特殊字符
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function loadNoteDetail() {
    const noteDetailEl = document.getElementById('note-detail');
    const id = getQueryParam('id');

    if (!id) {
        noteDetailEl.innerHTML = '<div class="note-content">未指定笔记ID</div>';
        return;
    }

    try {
        const token = localStorage.getItem('webnotebook_token');
        const res = await fetch(`http://localhost:3001/api/notes/search?keyword=&id=${id}`, {
            headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });

        if (!res.ok) {
            throw new Error('请求失败');
        }

        const notes = await res.json();
        const noteArr = notes.data || notes;
        const note = Array.isArray(noteArr) ? noteArr.find(n => n.id == id) : null;

        if (!note) {
            noteDetailEl.innerHTML = '<div class="note-content">未找到该笔记</div>';
            return;
        }

        // 添加渐入动画类
        noteDetailEl.innerHTML = `
            <div class="note-content">${escapeHtml(note.content)}</div>
            <div class="note-meta">
                <div class="note-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                    <a href="${escapeHtml(note.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(note.url)}</a>
                </div>
                <div class="note-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 8v8"></path>
                        <path d="M8 12h8"></path>
                    </svg>
                    颜色：<span class="note-color" style="color:${escapeHtml(note.color)}"></span>
                </div>
                <div class="note-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                        <line x1="7" y1="7" x2="7.01" y2="7"></line>
                    </svg>
                    <div class="note-tags">${note.tags ? escapeHtml(note.tags) : '无标签'}</div>
                </div>
                <div class="note-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    保存时间：${formatDateTime(note.createdAt)}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('加载笔记失败:', error);
        noteDetailEl.innerHTML = '<div class="note-content">加载失败，请重试</div>';
    }
}

window.onload = loadNoteDetail;

// 关闭按钮处理
const closeBtn = document.getElementById('close-btn');
if (closeBtn) {
    closeBtn.onclick = function () {
        window.close();
        setTimeout(() => {
            if (!window.closed) {
                closeBtn.textContent = '请手动关闭标签页';
                closeBtn.disabled = true;
            }
        }, 300);
    };
} 