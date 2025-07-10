import React, { useEffect, useState } from 'react';
import { fetchNotes, deleteNote, batchDeleteNotes, editNote, exportNotes } from '../api';

export default function NotesList({ token }) {
    const [notes, setNotes] = useState([]);
    const [msg, setMsg] = useState('');
    const [selected, setSelected] = useState([]);
    const [editId, setEditId] = useState(null);
    const [editData, setEditData] = useState({ content: '', color: '', tags: '' });
    const [searchParams, setSearchParams] = useState({});
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalNotes: 0,
        limit: 10
    });

    const loadNotes = async (page = 1, search = '') => {
        try {
            const query = `page=${page}&limit=${pagination.limit}${search ? '&' + search : ''}`;
            const response = await fetchNotes(token, query);

            // 处理不同的响应格式
            const data = response.data || response;
            const total = response.total || (Array.isArray(response) ? response.length : 0);

            setNotes(Array.isArray(data) ? data : []);
            setPagination({
                ...pagination,
                currentPage: page,
                totalPages: Math.ceil(total / pagination.limit),
                totalNotes: total
            });
        } catch (error) {
            console.error('加载笔记失败:', error);
            setMsg('获取失败');
        }
    };

    useEffect(() => {
        loadNotes(1);
    }, [token]);

    const handleDelete = async id => {
        if (!window.confirm('确定删除？')) return;
        await deleteNote(token, id);
        loadNotes(pagination.currentPage);
    };

    const handleSelect = id => {
        setSelected(selected.includes(id) ? selected.filter(i => i !== id) : [...selected, id]);
    };

    const handleBatchDelete = async () => {
        if (!window.confirm('确定批量删除？')) return;
        await batchDeleteNotes(token, selected);
        setSelected([]);
        loadNotes(1);
    };

    const startEdit = note => {
        setEditId(note.id);
        setEditData({ content: note.content, color: note.color, tags: note.tags });
    };

    const handleEditChange = e => {
        setEditData({ ...editData, [e.target.name]: e.target.value });
    };

    const handleEditSave = async () => {
        await editNote(token, editId, editData);
        loadNotes(pagination.currentPage);
        setEditId(null);
    };

    const handleSearch = e => {
        e.preventDefault();
        const input = e.target.elements.search.value.trim();
        const query = input ? `keyword=${encodeURIComponent(input)}` : '';
        loadNotes(1, query);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            loadNotes(newPage);
        }
    };

    return (
        <div className="container mt-4">
            <h3 style={{ fontWeight: 600, letterSpacing: 1 }}>我的笔记 ({pagination.totalNotes})</h3>
            {msg && <div className="text-danger">{msg}</div>}
            <div className="d-flex mb-3">
                <button className="btn btn-danger me-2" style={{ borderRadius: 8, padding: '8px 24px', fontWeight: 500 }} disabled={!selected.length} onClick={handleBatchDelete}>批量删除</button>
                <button className="btn btn-success" style={{ borderRadius: 8, padding: '8px 24px', fontWeight: 500 }} onClick={() => exportNotes(searchParams)}>导出</button>
            </div>
            <form className="input-group mb-3" onSubmit={handleSearch} style={{ maxWidth: 400 }}>
                <input name="search" type="text" className="form-control" placeholder="搜索内容、标签或网址" />
                <button className="btn btn-primary" type="submit">搜索</button>
            </form>
            <div className="row" style={{ gap: '18px 0' }}>
                {notes.map(n => (
                    <div key={n.id} className="col-12 col-md-6 col-lg-4">
                        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px #b6c6e633', padding: '20px 18px 14px 18px', marginBottom: 18, position: 'relative', transition: 'box-shadow 0.2s' }}>
                            <div style={{ position: 'absolute', top: 18, right: 18 }}>
                                <input type="checkbox" checked={selected.includes(n.id)} onChange={() => handleSelect(n.id)} />
                            </div>
                            {editId === n.id ? (
                                <>
                                    <textarea name="content" value={editData.content} onChange={handleEditChange} className="form-control mb-2" style={{ borderRadius: 8, minHeight: 60 }} />
                                    <div className="mb-2">
                                        <span style={{ fontSize: 14, color: '#888' }}>颜色：</span>
                                        <input name="color" value={editData.color} onChange={handleEditChange} className="form-control d-inline-block" style={{ width: 100, display: 'inline-block', borderRadius: 8 }} />
                                    </div>
                                    <div className="mb-2">
                                        <span style={{ fontSize: 14, color: '#888' }}>标签：</span>
                                        <input name="tags" value={editData.tags} onChange={handleEditChange} className="form-control d-inline-block" style={{ width: 120, display: 'inline-block', borderRadius: 8 }} />
                                    </div>
                                    <div className="mb-2" style={{ fontSize: 13, color: '#888' }}>时间：{n.createdAt}</div>
                                    <div>
                                        <button className="btn btn-success btn-sm me-2" style={{ borderRadius: 7, padding: '6px 18px' }} onClick={handleEditSave}>保存</button>
                                        <button className="btn btn-secondary btn-sm" style={{ borderRadius: 7, padding: '6px 18px' }} onClick={() => setEditId(null)}>取消</button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ fontWeight: 500, fontSize: 16, marginBottom: 8, wordBreak: 'break-all', color: '#222' }}>
                                        {n.content.length > 50 ? n.content.slice(0, 50) + '...' : n.content}
                                    </div>
                                    <div className="mb-2" style={{ fontSize: 14 }}>
                                        <span style={{ background: '#f7fafd', borderRadius: 6, padding: '2px 8px', marginRight: 8 }}>标签：{n.tags || '无'}</span>
                                        <span style={{ background: '#f7fafd', borderRadius: 6, padding: '2px 8px' }}>颜色：<span style={{ color: n.color }}>{n.color}</span></span>
                                    </div>
                                    <div className="mb-2" style={{ fontSize: 13, color: '#888' }}>时间：{n.createdAt}</div>
                                    <div className="mb-2" style={{ fontSize: 13 }}>
                                        <a href={n.url} target="_blank" rel="noreferrer" style={{ color: '#5b9df9', textDecoration: 'underline' }}>来源</a>
                                    </div>
                                    <div>
                                        <button className="btn btn-primary btn-sm me-2" style={{ borderRadius: 7, padding: '6px 18px' }} onClick={() => startEdit(n)}>编辑</button>
                                        <button className="btn btn-danger btn-sm" style={{ borderRadius: 7, padding: '6px 18px' }} onClick={() => handleDelete(n.id)}>删除</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* 分页控件 */}
            {pagination.totalPages > 1 && (
                <div className="d-flex justify-content-center align-items-center mt-4 mb-4">
                    <button
                        className="btn btn-outline-primary me-2"
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                    >
                        上一页
                    </button>
                    <span className="mx-3">
                        第 {pagination.currentPage} 页，共 {pagination.totalPages} 页
                    </span>
                    <button
                        className="btn btn-outline-primary ms-2"
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                    >
                        下一页
                    </button>
                </div>
            )}
        </div>
    );
} 