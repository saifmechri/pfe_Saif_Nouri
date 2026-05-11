const ReportModel = require('../models/report.model');

// Creates a new report submitted by a user (automobiliste, garage, vendeur).
const createReport = async (req, res) => {
  try {
    const { reported_entity_type, reported_entity_id, reason, details } = req.body;
    const reporter_user_id = req.user?.id || null;

    // Validate required fields
    if (!reported_entity_type || !reported_entity_id || !reason) {
      return res.status(400).json({ success: false, error: 'MISSING_REQUIRED_FIELDS', message: 'reported_entity_type, reported_entity_id, and reason are required' });
    }

    // Validate entity type
    const validEntityTypes = ['garage', 'review', 'user', 'piece', 'comment'];
    if (!validEntityTypes.includes(reported_entity_type)) {
      return res.status(400).json({ success: false, error: 'INVALID_ENTITY_TYPE', message: `Entity type must be one of: ${validEntityTypes.join(', ')}` });
    }

    // Create the report
    const report = await ReportModel.createReport({
      reporter_user_id,
      reported_entity_type,
      reported_entity_id: parseInt(reported_entity_id, 10),
      reason,
      details: details || null
    });

    res.status(201).json({ success: true, data: report, message: 'Report submitted successfully' });
  } catch (err) {
    console.error('createReport error', err);
    res.status(500).json({ success: false, error: 'INTERNAL_SERVER_ERROR' });
  }
};

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

// Returns aggregated counters for the admin dashboard.
const getReportStats = async (req, res) => {
  try {
    const stats = await ReportModel.getReportSummary();
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('getReportStats error', err);
    res.status(500).json({ success: false, error: 'INTERNAL_SERVER_ERROR' });
  }
};

// Marks a report as resolved and stores the admin action note.
const resolveReport = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ success: false, error: 'INVALID_ID' });
    const { actionTaken } = req.body || {};
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
    const { note } = req.body || {};
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
  createReport,
  listPendingReports,
  getReport,
  getReportStats,
  resolveReport,
  dismissReport
};
