const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');
const auth = require('../middleware/auth');

router.post('/', auth, notesController.createNote);
router.get('/', auth, notesController.getNotes);
router.get('/search', auth, notesController.searchNotes);
router.delete('/:id', auth, notesController.deleteNote);
router.post('/batch-delete', auth, notesController.batchDelete);
router.put('/:id', auth, notesController.editNote);
router.get('/export', auth, notesController.exportNotes);

module.exports = router; 