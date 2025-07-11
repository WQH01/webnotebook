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
    let notes;
    const { ids, keyword } = req.query;

    try {
        if (ids) {
            // 导出选中的笔记
            const selectedIds = ids.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
            if (selectedIds.length === 0) {
                throw new Error('无效的笔记ID');
            }
            notes = await Note.searchNotes(req.user.id, { id: selectedIds });
            if (notes.length === 0) {
                throw new Error('未找到指定的笔记');
            }
            res.setHeader('Content-Disposition', `attachment; filename=selected_notes_${selectedIds.length}.xlsx`);
        } else if (keyword) {
            // 导出搜索结果
            notes = await Note.searchNotes(req.user.id, { keyword });
            if (notes.length === 0) {
                throw new Error('未找到匹配的笔记');
            }
            res.setHeader('Content-Disposition', `attachment; filename=search_notes_${encodeURIComponent(keyword)}.xlsx`);
        } else {
            // 导出所有笔记
            notes = await Note.searchNotes(req.user.id, {});
            if (notes.length === 0) {
                throw new Error('没有可导出的笔记');
            }
            res.setHeader('Content-Disposition', 'attachment; filename=all_notes.xlsx');
        }

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Notes');

        // 设置列宽和标题
        sheet.columns = [
            { header: 'ID', key: 'id', width: 8 },
            { header: '内容', key: 'content', width: 50 },
            { header: '来源URL', key: 'url', width: 30 },
            { header: '颜色', key: 'color', width: 10 },
            { header: '标签', key: 'tags', width: 20 },
            { header: '创建时间', key: 'createdAt', width: 20 },
            { header: '更新时间', key: 'updatedAt', width: 20 }
        ];

        // 添加数据并设置样式
        notes.forEach(note => {
            const row = sheet.addRow(note);
            row.eachCell(cell => {
                cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        // 设置表头样式
        const headerRow = sheet.getRow(1);
        headerRow.eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            cell.font = { bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('导出笔记失败:', error);
        res.status(400).json({ message: error.message || '导出失败' });
    }
}; 