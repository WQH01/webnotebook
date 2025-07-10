const Note = require('../models/note');
const ExcelJS = require('exceljs');

exports.createNote = async (req, res) => {
    const { content, url, color, tags } = req.body;
    if (!content) return res.status(400).json({ message: 'Content required' });
    const id = await Note.createNote({
        userId: req.user.id,
        content,
        url,
        color,
        tags: Array.isArray(tags) ? tags.join(',') : tags
    });
    res.json({ id });
};

exports.getNotes = async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const notes = await Note.getNotes(req.user.id, Number(limit), (Number(page) - 1) * Number(limit));
    res.json(notes);
};

exports.searchNotes = async (req, res) => {
    const { keyword, url, start, end, tags, color, id } = req.query;
    const limit = Number(req.query.limit) || 20;
    const page = Number(req.query.page) || 1;
    const offset = (page - 1) * limit;
    const { data, total } = await Note.searchNotesPaged(req.user.id, { keyword, url, start, end, tags, color, id, limit, offset });
    res.json({ data, total });
};

exports.deleteNote = async (req, res) => {
    const ok = await Note.deleteNote(req.user.id, req.params.id);
    if (ok) res.json({ success: true });
    else res.status(404).json({ message: 'Note not found' });
};

// 批量删除
exports.batchDelete = async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'No ids' });
    const results = await Note.batchDelete(req.user.id, ids);
    res.json({ success: true, deleted: results });
};

// 编辑笔记
exports.editNote = async (req, res) => {
    const { content, color, tags } = req.body;
    const ok = await Note.editNote(req.user.id, req.params.id, { content, color, tags });
    if (ok) res.json({ success: true });
    else res.status(404).json({ message: 'Note not found or no permission' });
};

exports.exportNotes = async (req, res) => {
    const { keyword, url, start, end, tags, color, id } = req.query;
    const notes = await Note.searchNotes(req.user.id, { keyword, url, start, end, tags, color, id });
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Notes');
    sheet.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: '内容', key: 'content', width: 50 },
        { header: '来源URL', key: 'url', width: 30 },
        { header: '颜色', key: 'color', width: 10 },
        { header: '标签', key: 'tags', width: 20 },
        { header: '创建时间', key: 'createdAt', width: 20 },
        { header: '更新时间', key: 'updatedAt', width: 20 }
    ];
    notes.forEach(note => sheet.addRow(note));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=notes.xlsx');
    await workbook.xlsx.write(res);
    res.end();
}; 