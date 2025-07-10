import React, { useEffect, useState } from 'react';
import { fetchNotes, deleteNote, batchDeleteNotes, editNote, exportNotes } from '../api';

export default function NotesList({ token }) {
    const [notes, setNotes] = useState([]);
    const [msg, setMsg] = useState('');
    const [selected, setSelected] = useState([]);
    const [editId, setEditId] = useState(null);
    const [editData, setEditData] = useState({ content: '', color: '', tags: '' });
    const [searchParams, setSearchParams] = useState({}); // 可根据实际筛选条件扩展

    useEffect(() => {
        fetchNotes(token)
            .then(res => setNotes(res.data || res))
            .catch(() => setMsg('获取失败'));
    }, [token]);

    const handleDelete = async id => {
        if (!window.confirm('确定删除？')) return;
        await deleteNote(token, id);
        setNotes(notes.filter(n => n.id !== id));
    };

    const handleSelect = id => {
        setSelected(selected.includes(id) ? selected.filter(i => i !== id) : [...selected, id]);
    };

    const handleBatchDelete = async () => {
        if (!window.confirm('确定批量删除？')) return;
        await batchDeleteNotes(token, selected);
        setNotes(notes.filter(n => !selected.includes(n.id)));
        setSelected([]);
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
        setNotes(notes.map(n => n.id === editId ? { ...n, ...editData } : n));
        setEditId(null);
    };

    function handleExport() {
        exportNotes(searchParams).then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'notes.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        }).catch(e => {
            alert('导出失败: ' + e.message);
        });
    }

    // 新增：处理搜索
    function handleSearch(e) {
        e.preventDefault();
        const input = e.target.elements.search.value.trim();
        const query = input ? `keyword=${encodeURIComponent(input)}` : '';
        fetchNotes(token, query)
            .then(res => setNotes(res.data || res))
            .catch(() => setMsg('获取失败'));
    }

    return (
        <div className="container mt-4">
            <h3 style={{ fontWeight: 600, letterSpacing: 1 }}>我的笔记</h3>
            {msg && <div className="text-danger">{msg}</div>}
            <div className="d-flex mb-3">
                <button className="btn btn-danger me-2" style={{ borderRadius: 8, padding: '8px 24px', fontWeight: 500 }} disabled={!selected.length} onClick={handleBatchDelete}>批量删除</button>
                <button className="btn btn-success" style={{ borderRadius: 8, padding: '8px 24px', fontWeight: 500 }} onClick={handleExport}>导出</button>
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
        </div>
    );
} 