// 获取 URL 参数
function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

async function loadNoteDetail() {
    const id = getQueryParam('id');
    if (!id) {
        document.getElementById('note-detail').innerHTML = '未指定笔记ID';
        return;
    }
    const token = localStorage.getItem('webnotebook_token');
    const res = await fetch(`http://localhost:3001/api/notes/search?keyword=&id=${id}`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
    });
    if (res.ok) {
        const notes = await res.json();
        const noteArr = notes.data || notes;
        const note = Array.isArray(noteArr) ? noteArr.find(n => n.id == id) : null;
        if (!note) {
            document.getElementById('note-detail').innerHTML = '未找到该笔记';
            return;
        }
        document.getElementById('note-detail').innerHTML = `
      <div class="note-content">${note.content}</div>
      <div class="note-label">来源：<a href="${note.url}" target="_blank">${note.url}</a></div>
      <div class="note-label">颜色：<span class="note-color" style="color:${note.color}">${note.color}</span></div>
      <div class="note-label note-tags">标签/备注：${note.tags || '无'}</div>
      <div class="note-label">保存时间：${note.createdAt}</div>
    `;
    } else {
        document.getElementById('note-detail').innerHTML = '加载失败，请重试';
    }
}

window.onload = loadNoteDetail;

// 关闭按钮兼容处理
if (document.getElementById('close-btn')) {
    document.getElementById('close-btn').onclick = function () {
        window.close();
        setTimeout(() => {
            if (!window.closed) {
                const btn = document.getElementById('close-btn');
                btn.textContent = '请手动关闭标签页';
                btn.style.background = '#eee';
                btn.style.color = '#888';
                btn.disabled = true;
            }
        }, 300);
    };
} 