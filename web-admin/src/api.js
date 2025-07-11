const API = 'http://localhost:3001/api';

export async function login(username, password) {
    const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error('登录失败');
    return res.json();
}

export async function register(username, email, password) {
    const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });
    if (!res.ok) throw new Error('注册失败');
    return res.json();
}

export async function fetchNotes(token, params = '') {
    // 如果有参数，使用search接口，否则使用普通获取接口
    let url = `${API}/notes${params ? '/search' : ''}`;
    if (params && params.trim()) {
        url = `${url}?${params}`;
    }
    const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('获取笔记失败');
    return res.json();
}

export async function deleteNote(token, id) {
    const res = await fetch(`${API}/notes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('删除失败');
    return res.json();
}

export async function batchDeleteNotes(token, ids) {
    const res = await fetch(`${API}/notes/batch-delete`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids })
    });
    if (!res.ok) throw new Error('批量删除失败');
    return res.json();
}

export async function editNote(token, id, data) {
    const res = await fetch(`${API}/notes/${id}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('编辑失败');
    return res.json();
}

export async function exportNotes(token, selectedIds = [], searchParams = null) {
    let url = `${API}/notes/export`;
    const params = new URLSearchParams();

    // 如果有选中的ID，添加到参数中
    if (Array.isArray(selectedIds) && selectedIds.length > 0) {
        params.append('ids', selectedIds.join(','));
    }

    // 如果有搜索参数，添加到参数中
    if (searchParams && searchParams.keyword) {
        params.append('keyword', searchParams.keyword);
    }

    // 将所有参数添加到URL
    const queryString = params.toString();
    if (queryString) {
        url += `?${queryString}`;
    }

    const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
        const error = await res.text();
        throw new Error(error || '导出失败');
    }
    return await res.blob();
} 