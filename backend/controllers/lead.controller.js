const catchAsync = require('../utils/catchAsync');
const LeadService = require('../services/lead.service');

const createLead = catchAsync(async (req, res) => {
  const leadId = await LeadService.createLead(req.body);
  res.status(201).send({ id: leadId, message: 'Lead created successfully' });
});

const getLeads = catchAsync(async (req, res) => {
  const { status, assigned_user_id, search, page, limit } = req.query;
  const filters = {};

  if (status) filters.status = status;

  // Members can only see their assigned leads
  if (req.user && req.user.role === 'member') {
    filters.assigned_user_id = req.user.id;
  } else if (assigned_user_id) {
    filters.assigned_user_id = assigned_user_id;
  }

  if (search) filters.search = search;

  const result = await LeadService.getLeads(
    filters,
    page ? parseInt(page, 10) : 1,
    limit ? parseInt(limit, 10) : 10
  );
  res.send(result);
});

const getLeadById = catchAsync(async (req, res) => {
  const lead = await LeadService.getLeadById(req.params.id);
  // Members can only view leads assigned to them
  if (req.user.role === 'member' && lead.assigned_user_id !== req.user.id) {
    return res.status(403).send({ message: 'Forbidden' });
  }
  res.send(lead);
});

const updateLead = catchAsync(async (req, res) => {
  const lead = await LeadService.updateLead(req.params.id, req.body, req.user.id, req.user.role);
  res.send(lead);
});

const assignLead = catchAsync(async (req, res) => {
  const lead = await LeadService.assignLead(req.params.id, req.body.assigned_user_id, req.user.id);
  res.send(lead);
});

const deleteLead = catchAsync(async (req, res) => {
  await LeadService.deleteLead(req.params.id, req.user.id);
  res.status(204).send();
});

const addNote = catchAsync(async (req, res) => {
  await LeadService.addNote(req.params.id, req.user.id, req.body.message);
  res.status(201).send({ message: 'Note added successfully' });
});

const getLeadActivities = catchAsync(async (req, res) => {
  // Members can only view activities for their assigned leads
  if (req.user.role === 'member') {
    const lead = await LeadService.getLeadById(req.params.id);
    if (lead.assigned_user_id !== req.user.id) {
      return res.status(403).send({ message: 'Forbidden' });
    }
  }
  const activities = await LeadService.getLeadActivities(req.params.id);
  res.send({ activities });
});

module.exports = {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  assignLead,
  deleteLead,
  addNote,
  getLeadActivities
};
