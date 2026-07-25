const LeadModel = require('../models/lead.model');
const NoteModel = require('../models/note.model');
const ActivityModel = require('../models/activity.model');
const ApiError = require('../utils/ApiError');

class LeadService {
  static async createLead(leadData) {
    const id = await LeadModel.create(leadData);
    await ActivityModel.log(null, 'Lead Created via Public Form', 'lead', id, { name: leadData.name });
    return id;
  }

  static async getLeads(filters = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const result = await LeadModel.findAll(filters, limit, offset);
    return {
      leads: result.leads,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      }
    };
  }

  static async getLeadById(id) {
    const lead = await LeadModel.findById(id);
    if (!lead) {
      throw new ApiError(404, 'Lead not found');
    }
    const notes = await NoteModel.findByLeadId(id);
    const activities = await ActivityModel.getByLeadId(id);
    lead.notes = notes;
    lead.activities = activities;
    return lead;
  }

  static async getLeadActivities(id) {
    // Directly retrieve activities; existence check is omitted to simplify endpoint handling.
    return await ActivityModel.getByLeadId(id);
  }

  static async updateLead(id, updateData, userId, userRole) {
    const lead = await LeadModel.findById(id);
    if (!lead) {
      throw new ApiError(404, 'Lead not found');
    }

    if (userRole === 'member' && lead.assigned_user_id !== userId) {
      throw new ApiError(403, 'Not authorized to update this lead');
    }

    // Members cannot assign leads
    if (userRole === 'member' && updateData.assigned_user_id !== undefined) {
      delete updateData.assigned_user_id;
    }

    await LeadModel.update(id, updateData);
    if (updateData.status) {
      await ActivityModel.log(userId, 'Status Changed', 'lead', id, { from: lead.status, to: updateData.status });
    } else {
      await ActivityModel.log(userId, 'Lead Updated', 'lead', id, updateData);
    }
    return await this.getLeadById(id);
  }

  static async assignLead(id, assignedUserId, adminId) {
    const lead = await LeadModel.findById(id);
    if (!lead) {
      throw new ApiError(404, 'Lead not found');
    }
    await LeadModel.update(id, { assigned_user_id: assignedUserId || null });
    await ActivityModel.log(adminId, 'Lead Assigned', 'lead', id, { assigned_user_id: assignedUserId });
    return await this.getLeadById(id);
  }

  static async deleteLead(id, adminId) {
    const lead = await LeadModel.findById(id);
    if (!lead) {
      throw new ApiError(404, 'Lead not found');
    }
    await LeadModel.delete(id);
    await ActivityModel.log(adminId, 'Lead Deleted', 'lead', id, { name: lead.name });
  }

  static async addNote(leadId, authorId, message) {
    const lead = await LeadModel.findById(leadId);
    if (!lead) {
      throw new ApiError(404, 'Lead not found');
    }
    const noteId = await NoteModel.create({ lead_id: leadId, author_id: authorId, message });
    await ActivityModel.log(authorId, 'Note Added', 'lead', leadId, { note_id: noteId, preview: message.substring(0, 50) });
    return noteId;
  }
}

module.exports = LeadService;
