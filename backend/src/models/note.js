const pool = require('../utils/db');
const dayjs = require('dayjs');

async function createNote({ userId, content, url, color, tags }) {
    const [result] = await pool.query(
        'INSERT INTO notes (userId, content, url, color, tags) VALUES (?, ?, ?, ?, ?)',
        [userId, content, url, color, tags]
    );
    return result.insertId;
}

function formatNoteTime(note) {
    if (note.createdAt) note.createdAt = dayjs(note.createdAt).format('YYYY-MM-DD HH:mm:ss');
    if (note.updatedAt) note.updatedAt = dayjs(note.updatedAt).format('YYYY-MM-DD HH:mm:ss');
    return note;
}

async function getNotes(userId, limit = 20, offset = 0) {
    const [rows] = await pool.query(
        'SELECT * FROM notes WHERE userId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?',
        [userId, limit, offset]
    );
    return rows.map(formatNoteTime);
}

async function searchNotes(userId, { keyword, url, start, end, tags, color, id }) {
    let sql = 'SELECT * FROM notes WHERE userId = ?';
    const params = [userId];
    if (id) {
        if (Array.isArray(id)) {
            sql += ` AND id IN (${id.map(() => '?').join(',')})`;
            params.push(...id);
        } else {
            sql += ' AND id = ?';
            params.push(id);
        }
    }
    if (keyword) {
        sql += ' AND (content LIKE ? OR tags LIKE ? OR url LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (url) {
        sql += ' AND url LIKE ?';
        params.push(`%${url}%`);
    }
    if (start) {
        sql += ' AND createdAt >= ?';
        params.push(start);
    }
    if (end) {
        sql += ' AND createdAt <= ?';
        params.push(end);
    }
    if (tags) {
        sql += ' AND tags LIKE ?';
        params.push(`%${tags}%`);
    }
    if (color) {
        sql += ' AND color = ?';
        params.push(color);
    }
    sql += ' ORDER BY createdAt DESC';
    const [rows] = await pool.query(sql, params);
    return rows.map(formatNoteTime);
}

async function searchNotesPaged(userId, { keyword, url, start, end, tags, color, id, limit = 20, offset = 0 }) {
    let sql = 'FROM notes WHERE userId = ?';
    const params = [userId];
    if (id) {
        sql += ' AND id = ?';
        params.push(id);
    }
    if (keyword) {
        sql += ' AND (content LIKE ? OR tags LIKE ? OR url LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (url) {
        sql += ' AND url LIKE ?';
        params.push(`%${url}%`);
    }
    if (start) {
        sql += ' AND createdAt >= ?';
        params.push(start);
    }
    if (end) {
        sql += ' AND createdAt <= ?';
        params.push(end);
    }
    if (tags) {
        sql += ' AND tags LIKE ?';
        params.push(`%${tags}%`);
    }
    if (color) {
        sql += ' AND color = ?';
        params.push(color);
    }
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total ${sql}`, params);
    const [data] = await pool.query(`SELECT * ${sql} ORDER BY createdAt DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
    return { data: data.map(formatNoteTime), total };
}

async function deleteNote(userId, noteId) {
    const [result] = await pool.query('DELETE FROM notes WHERE id = ? AND userId = ?', [noteId, userId]);
    return result.affectedRows > 0;
}

// 批量删除
async function batchDelete(userId, ids) {
    if (!ids.length) return 0;
    const [result] = await pool.query(
        `DELETE FROM notes WHERE userId = ? AND id IN (${ids.map(() => '?').join(',')})`,
        [userId, ...ids]
    );
    return result.affectedRows;
}

// 编辑笔记
async function editNote(userId, noteId, { content, color, tags }) {
    const [result] = await pool.query(
        'UPDATE notes SET content = ?, color = ?, tags = ?, updatedAt = NOW() WHERE id = ? AND userId = ?',
        [content, color, tags, noteId, userId]
    );
    return result.affectedRows > 0;
}

async function getNoteById(userId, noteId) {
    const [rows] = await pool.query('SELECT * FROM notes WHERE id = ? AND userId = ?', [noteId, userId]);
    return rows[0] ? formatNoteTime(rows[0]) : undefined;
}

module.exports = { createNote, getNotes, searchNotes, searchNotesPaged, deleteNote, batchDelete, editNote, getNoteById }; 