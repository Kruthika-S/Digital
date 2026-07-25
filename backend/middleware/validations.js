const Joi = require('joi');

const authValidation = {
  login: {
    body: Joi.object().keys({
      email: Joi.string().required().email(),
      password: Joi.string().required(),
    }),
  },
  refreshToken: {
    body: Joi.object().keys({
      token: Joi.string().required(),
    }),
  }
};

const userValidation = {
  createUser: {
    body: Joi.object().keys({
      name: Joi.string().required(),
      email: Joi.string().required().email(),
      password: Joi.string().required().min(6),
      role: Joi.string().valid('admin', 'member'),
    }),
  },
};

const leadValidation = {
  createLead: {
    body: Joi.object().keys({
      name: Joi.string().required(),
      company: Joi.string().required(),
      email: Joi.string().required().email(),
      phone: Joi.string().allow('', null),
      source: Joi.string().allow('', null),
    }),
  },
  updateLead: {
    params: Joi.object().keys({
      id: Joi.number().required(),
    }),
    body: Joi.object().keys({
      name: Joi.string(),
      company: Joi.string(),
      email: Joi.string().email(),
      phone: Joi.string().allow('', null),
      source: Joi.string().allow('', null),
      status: Joi.string().valid('New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'),
    }).min(1),
  },
  assignLead: {
    params: Joi.object().keys({
      id: Joi.number().required(),
    }),
    body: Joi.object().keys({
      assigned_user_id: Joi.number().required(),
    }),
  },
  addNote: {
    params: Joi.object().keys({
      id: Joi.number().required(),
    }),
    body: Joi.object().keys({
      message: Joi.string().required(),
    }),
  },
  getLeads: {
    query: Joi.object().keys({
      status: Joi.string(),
      assigned_user_id: Joi.number(),
      search: Joi.string(),
      page: Joi.number().integer().min(1),
      limit: Joi.number().integer().min(1).max(100),
    }),
  },
};

module.exports = {
  authValidation,
  userValidation,
  leadValidation,
};
