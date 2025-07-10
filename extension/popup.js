// 登录/注册切换
document.getElementById('to-register').addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('login-card').classList.add('hidden');
    document.getElementById('register-card').classList.remove('hidden');
    clearMessages();
});

document.getElementById('to-login').addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('register-card').classList.add('hidden');
    document.getElementById('login-card').classList.remove('hidden');
    clearMessages();
});

// 清除所有消息
function clearMessages() {
    document.getElementById('login-msg').classList.add('hidden');
    document.getElementById('register-msg').classList.add('hidden');
}

// 登录
document.getElementById('login-btn').addEventListener('click', async () => {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const msg = document.getElementById('login-msg');
    const msgText = document.getElementById('login-msg-text');

    msg.classList.add('hidden');

    if (!username || !password) {
        msgText.textContent = '请输入用户名和密码';
        msg.classList.remove('hidden');
        return;
    }

    setSyncStatus('syncing', '登录中...');

    try {
        const res = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('webnotebook_token', data.token);
            chrome.storage.local.set({ webnotebook_token: data.token });

            document.getElementById('login-card').classList.add('hidden');
            document.getElementById('register-card').classList.add('hidden');
            document.getElementById('notes-card').classList.remove('hidden');
            document.getElementById('logout-btn').classList.remove('hidden');

            fetchNotes();
        } else {
            const errorData = await res.json();
            msgText.textContent = errorData.message || '登录失败，请检查用户名和密码';
            msg.classList.remove('hidden');
            setSyncStatus('error', '登录失败');
        }
    } catch (error) {
        console.error('登录错误:', error);
        msgText.textContent = '网络错误，请稍后再试';
        msg.classList.remove('hidden');
        setSyncStatus('error', '网络错误');
    } finally {
        setTimeout(() => {
            setSyncStatus('success', '已同步');
        }, 1000);
    }
});

// 注册
document.getElementById('register-btn').addEventListener('click', async () => {
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const msg = document.getElementById('register-msg');
    const msgText = document.getElementById('register-msg-text');

    msg.classList.add('hidden');

    if (!username || !email || !password) {
        msgText.textContent = '请填写所有字段';
        msg.classList.remove('hidden');
        return;
    }

    if (password.length < 6) {
        msgText.textContent = '密码长度至少为6位';
        msg.classList.remove('hidden');
        return;
    }

    setSyncStatus('syncing', '注册中...');

    try {
        const res = await fetch('http://localhost:3001/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        if (res.ok) {
            msgText.textContent = '注册成功，请登录';
            msg.classList.remove('hidden');
            msg.classList.remove('alert-danger');
            msg.classList.add('alert-success');

            setTimeout(() => {
                document.getElementById('register-card').classList.add('hidden');
                document.getElementById('login-card').classList.remove('hidden');
                msg.classList.add('hidden');
                msg.classList.remove('alert-success');
                msg.classList.add('alert-danger');

                // 填充登录表单
                document.getElementById('username').value = username;
                document.getElementById('password').value = password;
            }, 1500);
        } else {
            const errorData = await res.json();
            msgText.textContent = errorData.message || '注册失败，用户名或邮箱已存在';
            msg.classList.remove('hidden');
            setSyncStatus('error', '注册失败');
        }
    } catch (error) {
        console.error('注册错误:', error);
        msgText.textContent = '网络错误，请稍后再试';
        msg.classList.remove('hidden');
        setSyncStatus('error', '网络错误');
    } finally {
        setTimeout(() => {
            setSyncStatus('success', '已同步');
        }, 1000);
    }
});

// 退出
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('webnotebook_token');
    chrome.storage.local.remove('webnotebook_token');
    document.getElementById('logout-btn').classList.add('hidden');
    document.getElementById('notes-list').innerHTML = '';
    document.getElementById('notes-card').classList.add('hidden');
    document.getElementById('login-card').classList.remove('hidden');
    clearMessages();
});

let currentPage = 1;
let totalPages = 1;
let lastKeyword = '';

// 设置同步状态
function setSyncStatus(status, message) {
    const indicator = document.getElementById('sync-indicator');
    const statusText = document.getElementById('sync-status');

    indicator.className = 'indicator-dot';
    statusText.textContent = message;

    switch (status) {
        case 'syncing':
            indicator.classList.add('syncing');
            break;
        case 'success':
            indicator.style.background = 'var(--success)';
            break;
        case 'error':
            indicator.style.background = 'var(--danger)';
            break;
    }
}

// 修改 fetchNotes 只传 keyword 参数
async function fetchNotes(page = 1, searchInput = '') {
    const token = localStorage.getItem('webnotebook_token');
    const limit = 5;
    let url = `http://localhost:3001/api/notes/search?limit=${limit}&page=${page}`;
    if (searchInput && searchInput.trim()) {
        url += `&keyword=${encodeURIComponent(searchInput.trim())}`;
    }
    setSyncStatus('syncing', '同步中...');
    try {
        const res = await fetch(url, {
            headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        if (res.ok) {
            const notes = await res.json();
            let data = notes.data || notes;
            let total = notes.total || 0;
            if (!Array.isArray(data)) data = [];
            totalPages = Math.max(1, Math.ceil(total / limit));
            currentPage = page;
            lastKeyword = searchInput;
            document.getElementById('notes-count').textContent = total;
            if (data.length === 0) {
                document.getElementById('notes-list').innerHTML = `
                    <div class="empty-state">
                        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="#888" viewBox="0 0 16 16">
                            <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                        </svg>
                        <p>${searchInput ? '未找到相关笔记' : '暂无笔记，开始记录吧'}</p>
                    </div>
                `;
                document.getElementById('pagination-container').classList.add('hidden');
            } else {
                const list = data.map(n => `
                    <div class="note-item" data-id="${n.id}">
                        <div class="note-content">${n.content.length > 50 ? n.content.slice(0, 50) + '...' : n.content}</div>
                        <div class="note-meta">
                            <span>${new Date(n.createdAt).toLocaleDateString()}</span>
                            <a href="${n.url}" target="_blank">查看来源</a>
                        </div>
                    </div>
                `).join('');
                document.getElementById('notes-list').innerHTML = list;
                document.getElementById('pagination-container').classList.remove('hidden');
                document.querySelectorAll('.note-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const id = item.getAttribute('data-id');
                        chrome.tabs.create({ url: `note_detail.html?id=${id}` });
                    });
                });
            }
            document.getElementById('current-page').textContent = currentPage;
            document.getElementById('total-pages').textContent = totalPages;
            document.getElementById('prev-page').disabled = currentPage <= 1;
            document.getElementById('next-page').disabled = currentPage >= totalPages;
            setSyncStatus('success', '已同步所有笔记');
        } else {
            document.getElementById('notes-list').innerHTML = `
                <div class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="#dc3545" viewBox="0 0 16 16">
                        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                    </svg>
                    <p>获取笔记失败，请稍后再试</p>
                </div>
            `;
            document.getElementById('pagination-container').classList.add('hidden');
            setSyncStatus('error', '同步失败');
        }
    } catch (error) {
        console.error('获取笔记错误:', error);
        setSyncStatus('error', '网络错误');
    }
}

// 搜索按钮事件
document.getElementById('search-btn').addEventListener('click', () => {
    const input = document.getElementById('search-input').value;
    fetchNotes(1, input);
});

document.getElementById('search-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        const input = document.getElementById('search-input').value;
        fetchNotes(1, input);
    }
});

// 分页功能
document.getElementById('prev-page').addEventListener('click', () => {
    if (currentPage > 1) {
        fetchNotes(currentPage - 1, lastKeyword);
    }
});

document.getElementById('next-page').addEventListener('click', () => {
    if (currentPage < totalPages) {
        fetchNotes(currentPage + 1, lastKeyword);
    }
});

// 自动登录状态
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('webnotebook_token')) {
        document.getElementById('login-card').classList.add('hidden');
        document.getElementById('register-card').classList.add('hidden');
        document.getElementById('notes-card').classList.remove('hidden');
        document.getElementById('logout-btn').classList.remove('hidden');
        fetchNotes();
    } else {
        document.getElementById('notes-card').classList.add('hidden');
        document.getElementById('logout-btn').classList.add('hidden');
    }

    // 初始化分页
    document.getElementById('current-page').textContent = currentPage;
    document.getElementById('total-pages').textContent = totalPages;
    document.getElementById('prev-page').disabled = currentPage <= 1;
    document.getElementById('next-page').disabled = currentPage >= totalPages;
});