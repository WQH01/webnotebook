import React, { useEffect, useState } from 'react';
import { fetchNotes, deleteNote, batchDeleteNotes, editNote, exportNotes } from '../api';

export default function NotesList({ token }) {
    const [notes, setNotes] = useState([]);
    const [msg, setMsg] = useState('');
    const [selected, setSelected] = useState([]);
    const [editId, setEditId] = useState(null);
    const [editData, setEditData] = useState({ content: '', color: '', tags: '' });
    const [searchParams, setSearchParams] = useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showSingleDeleteConfirm, setShowSingleDeleteConfirm] = useState(false);
    const [deleteNoteId, setDeleteNoteId] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalNotes: 0,
        limit: 12
    });

    const loadNotes = async (page = 1, search = '') => {
        try {
            const query = `page=${page}&limit=${pagination.limit}${search ? '&' + search : ''}`;
            const response = await fetchNotes(token, query);
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
        setDeleteNoteId(id);
        setShowSingleDeleteConfirm(true);
    };

    const confirmSingleDelete = async () => {
        try {
            await deleteNote(token, deleteNoteId);
            loadNotes(pagination.currentPage);
            setMsg('删除成功');
            setTimeout(() => setMsg(''), 2000);
        } catch (error) {
            setMsg('删除失败');
        }
        setShowSingleDeleteConfirm(false);
        setDeleteNoteId(null);
    };

    const handleSelect = id => {
        setSelected(selected.includes(id) ? selected.filter(i => i !== id) : [...selected, id]);
    };

    const handleBatchDelete = async () => {
        setShowDeleteConfirm(true);
    };

    const confirmBatchDelete = async () => {
        try {
            await batchDeleteNotes(token, selected);
            setSelected([]);
            loadNotes(1);
            setMsg('批量删除成功');
            setTimeout(() => setMsg(''), 2000);
        } catch (error) {
            setMsg('批量删除失败');
        }
        setShowDeleteConfirm(false);
    };

    const handleExport = async () => {
        try {
            const selectedIds = selected.map(id => Number(id));
            const blob = await exportNotes(token, selectedIds);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = selectedIds.length > 0 ? `selected_notes_${selectedIds.length}.xlsx` : 'all_notes.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('导出失败:', error);
            setMsg('导出失败');
        }
    };

    const handleSearch = e => {
        e.preventDefault();
        const input = e.target.elements.search.value.trim();
        const query = input ? `keyword=${encodeURIComponent(input)}` : '';
        loadNotes(1, query);
    };

    return (
        <div className="notes-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <h2 style={{
                    fontSize: '24px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: 0
                }}>
                    我的笔记
                    <span style={{
                        background: '#007bff',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '14px'
                    }}>{pagination.totalNotes}</span>
                </h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        className="btn btn-danger"
                        style={{
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '8px 16px'
                        }}
                        disabled={!selected.length}
                        onClick={handleBatchDelete}
                    >
                        <i className="fas fa-trash"></i>
                        批量删除
                    </button>
                    <button
                        className="btn btn-success"
                        style={{
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '8px 16px'
                        }}
                        onClick={handleExport}
                    >
                        <i className="fas fa-download"></i>
                        {selected.length > 0 ? `导出 ${selected.length} 条笔记` : '导出全部笔记'}
                    </button>
                </div>
            </div>

            <div className="search-bar" style={{ marginBottom: '20px' }}>
                <form onSubmit={handleSearch} style={{ position: 'relative' }}>
                    <input
                        name="search"
                        type="text"
                        className="form-control"
                        placeholder="搜索内容、标签或网址..."
                        style={{
                            borderRadius: '24px',
                            padding: '12px 20px',
                            paddingRight: '50px',
                            border: '1px solid #e0e0e0',
                            width: '100%',
                            maxWidth: '400px'
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            position: 'absolute',
                            right: '15px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: '#666'
                        }}
                    >
                        <i className="fas fa-search"></i>
                    </button>
                </form>
            </div>

            {msg && (
                <div className={`alert ${msg.includes('成功') ? 'alert-success' : 'alert-danger'}`}
                    style={{
                        borderRadius: '8px',
                        marginBottom: '20px'
                    }}
                >
                    {msg}
                </div>
            )}

            <div className="notes-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px',
                marginBottom: '20px'
            }}>
                {notes.map(note => (
                    <div key={note.id} className="note-card" style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        position: 'relative',
                        border: '1px solid #eee'
                    }}>
                        <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
                            <input
                                type="checkbox"
                                checked={selected.includes(note.id)}
                                onChange={() => handleSelect(note.id)}
                                style={{
                                    width: '18px',
                                    height: '18px',
                                    cursor: 'pointer'
                                }}
                            />
                        </div>

                        <div className="note-content" style={{
                            fontSize: '16px',
                            marginBottom: '15px',
                            marginTop: '5px',
                            wordBreak: 'break-word',
                            color: note.color || '#333'
                        }}>
                            {note.content}
                        </div>

                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            marginBottom: '15px',
                            flexWrap: 'wrap'
                        }}>
                            {note.tags && (
                                <span style={{
                                    background: '#f0f0f0',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '14px'
                                }}>
                                    {note.tags}
                                </span>
                            )}
                            {note.color && (
                                <span style={{
                                    background: '#f0f0f0',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}>
                                    <span style={{
                                        display: 'inline-block',
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        background: note.color,
                                        border: '1px solid #ddd'
                                    }}></span>
                                </span>
                            )}
                        </div>

                        <div style={{
                            fontSize: '13px',
                            color: '#666',
                            marginBottom: '15px'
                        }}>
                            {note.createdAt}
                        </div>

                        {note.url && (
                            <a
                                href={note.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    display: 'block',
                                    marginBottom: '15px',
                                    color: '#007bff',
                                    textDecoration: 'none',
                                    fontSize: '14px'
                                }}
                            >
                                <i className="fas fa-link"></i> 查看来源
                            </a>
                        )}

                        <div style={{
                            display: 'flex',
                            gap: '10px',
                            marginTop: '15px'
                        }}>
                            <button
                                className="btn btn-primary"
                                style={{
                                    flex: 1,
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '5px'
                                }}
                                onClick={() => {
                                    setEditId(note.id);
                                    setEditData({
                                        content: note.content,
                                        color: note.color,
                                        tags: note.tags
                                    });
                                }}
                            >
                                <i className="fas fa-edit"></i>
                                编辑
                            </button>
                            <button
                                className="btn btn-danger"
                                style={{
                                    flex: 1,
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '5px'
                                }}
                                onClick={() => handleDelete(note.id)}
                            >
                                <i className="fas fa-trash"></i>
                                删除
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {pagination.totalPages > 1 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '10px',
                    marginTop: '20px'
                }}>
                    <button
                        className="btn btn-outline-primary"
                        onClick={() => loadNotes(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        style={{ borderRadius: '8px' }}
                    >
                        上一页
                    </button>
                    <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        margin: '0 10px'
                    }}>
                        第 {pagination.currentPage} 页，共 {pagination.totalPages} 页
                    </span>
                    <button
                        className="btn btn-outline-primary"
                        onClick={() => loadNotes(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        style={{ borderRadius: '8px' }}
                    >
                        下一页
                    </button>
                </div>
            )}

            {/* 编辑弹窗 */}
            {editId && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '30px',
                        borderRadius: '12px',
                        width: '90%',
                        maxWidth: '500px'
                    }}>
                        <h3 style={{ marginBottom: '20px' }}>编辑笔记</h3>
                        <div className="mb-3">
                            <label className="form-label">内容</label>
                            <textarea
                                name="content"
                                value={editData.content}
                                onChange={e => setEditData({ ...editData, content: e.target.value })}
                                className="form-control"
                                rows="4"
                                style={{ borderRadius: '8px' }}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">颜色</label>
                            <input
                                name="color"
                                value={editData.color}
                                onChange={e => setEditData({ ...editData, color: e.target.value })}
                                className="form-control"
                                style={{ borderRadius: '8px' }}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="form-label">标签</label>
                            <input
                                name="tags"
                                value={editData.tags}
                                onChange={e => setEditData({ ...editData, tags: e.target.value })}
                                className="form-control"
                                style={{ borderRadius: '8px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setEditId(null)}
                                style={{ borderRadius: '8px' }}
                            >
                                取消
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={async () => {
                                    try {
                                        await editNote(token, editId, editData);
                                        loadNotes(pagination.currentPage);
                                        setEditId(null);
                                        setMsg('编辑成功');
                                        setTimeout(() => setMsg(''), 2000);
                                    } catch (error) {
                                        setMsg('编辑失败');
                                    }
                                }}
                                style={{ borderRadius: '8px' }}
                            >
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSingleDeleteConfirm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        maxWidth: '400px',
                        width: '90%',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            fontSize: '24px',
                            color: '#ff4d4f',
                            marginBottom: '10px'
                        }}>
                            <i className="fas fa-exclamation-circle"></i>
                        </div>
                        <h3 style={{ marginBottom: '20px' }}>删除笔记</h3>
                        <p style={{ marginBottom: '20px' }}>
                            确定要删除这条笔记吗？删除后将无法恢复。
                        </p>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '10px'
                        }}>
                            <button
                                className="btn"
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd',
                                    backgroundColor: '#f5f5f5'
                                }}
                                onClick={() => {
                                    setShowSingleDeleteConfirm(false);
                                    setDeleteNoteId(null);
                                }}
                            >
                                取消
                            </button>
                            <button
                                className="btn btn-danger"
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '4px'
                                }}
                                onClick={confirmSingleDelete}
                            >
                                确定
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteConfirm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        maxWidth: '400px',
                        width: '90%',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            fontSize: '24px',
                            color: '#ff4d4f',
                            marginBottom: '10px'
                        }}>
                            <i className="fas fa-exclamation-circle"></i>
                        </div>
                        <h3 style={{ marginBottom: '20px' }}>批量删除笔记</h3>
                        <p style={{ marginBottom: '20px' }}>
                            确定要删除选中的 {selected.length} 条笔记吗？删除后将无法恢复。
                        </p>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '10px'
                        }}>
                            <button
                                className="btn"
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd',
                                    backgroundColor: '#f5f5f5'
                                }}
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                取消
                            </button>
                            <button
                                className="btn btn-danger"
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '4px'
                                }}
                                onClick={confirmBatchDelete}
                            >
                                确定
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 