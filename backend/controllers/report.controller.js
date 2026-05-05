const ReportModel = require('../models/report.model');

// Returns the reports that still need admin review.
const listPendingReports = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const reports = await ReportModel.getPendingReports({ limit: parseInt(limit, 10), offset: parseInt(offset, 10) });
    res.json({ success: true, data: reports });
  } catch (err) {
    console.error('listPendingReports error', err);
    res.status(500).json({ success: false, error: 'INTERNAL_SERVER_ERROR' });
  }
};

// Returns the full details of a single report.
const getReport = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ success: false, error: 'INVALID_ID' });
    const report = await ReportModel.getReportById(id);
    if (!report) return res.status(404).json({ success: false, error: 'REPORT_NOT_FOUND' });
    res.json({ success: true, data: report });
  } catch (err) {
    console.error('getReport error', err);
    res.status(500).json({ success: false, error: 'INTERNAL_SERVER_ERROR' });
  }
};

// Marks a report as resolved and stores the admin action note.
const resolveReport = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ success: false, error: 'INVALID_ID' });
    const { actionTaken } = req.body;
    const handled_by = (req.admin && req.admin.email) ? req.admin.email : null;
    const updated = await ReportModel.updateReportStatus(id, { status: 'resolved', action_taken: actionTaken || null, handled_by });
    if (!updated) return res.status(404).json({ success: false, error: 'REPORT_NOT_FOUND' });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('resolveReport error', err);
    res.status(500).json({ success: false, error: 'INTERNAL_SERVER_ERROR' });
  }
};

// Marks a report as dismissed when it is considered invalid or irrelevant.
const dismissReport = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ success: false, error: 'INVALID_ID' });
    const { note } = req.body;
    const handled_by = (req.admin && req.admin.email) ? req.admin.email : null;
    const updated = await ReportModel.updateReportStatus(id, { status: 'dismissed', action_taken: note || null, handled_by });
    if (!updated) return res.status(404).json({ success: false, error: 'REPORT_NOT_FOUND' });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('dismissReport error', err);
    res.status(500).json({ success: false, error: 'INTERNAL_SERVER_ERROR' });
  }
};

module.exports = {
  listPendingReports,
  getReport,
  resolveReport,
  dismissReport
};
