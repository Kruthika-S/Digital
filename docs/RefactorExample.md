# Refactor Example

## Before: Legacy Route Handler

```javascript
// routes/leads.js (Legacy)
const express = require('express');
const router = express.Router();
const db = require('../db');

// BAD: No validation, business logic in route, poor error handling, raw queries without parameterized inputs.
router.post('/create-lead', async (req, res) => {
    try {
        const name = req.body.name;
        const email = req.body.email;
        
        if (!name || !email) {
            return res.status(400).send("Missing data");
        }

        // Potential SQL injection if db.query doesn't parameterize
        const existing = await db.query(`SELECT * FROM leads WHERE email = '${email}'`);
        
        if (existing.length > 0) {
            return res.status(400).send("Email exists");
        }

        await db.query(`INSERT INTO leads (name, email, status) VALUES ('${name}', '${email}', 'New')`);
        
        // Sending email directly from route
        sendWelcomeEmail(email); 

        res.status(200).send("Success");
    } catch (e) {
        console.log(e);
        res.status(500).send("Error");
    }
});
```

## After: Refactored Architecture

### 1. Route Definition
```javascript
// routes/lead.routes.js
const express = require('express');
const leadController = require('../controllers/lead.controller');
const validate = require('../middleware/validate.middleware');
const { createLeadSchema } = require('../validations/lead.validation');

const router = express.Router();
router.post('/', validate(createLeadSchema), leadController.createLead);
module.exports = router;
```

### 2. Controller
```javascript
// controllers/lead.controller.js
const leadService = require('../services/lead.service');
const catchAsync = require('../utils/catchAsync');

const createLead = catchAsync(async (req, res) => {
    const lead = await leadService.createLead(req.body);
    res.status(201).json({ success: true, data: lead });
});

module.exports = { createLead };
```

### 3. Service Layer
```javascript
// services/lead.service.js
const LeadModel = require('../models/lead.model');
const ApiError = require('../utils/ApiError');
const emailService = require('./email.service');

const createLead = async (leadData) => {
    const existing = await LeadModel.findByEmail(leadData.email);
    if (existing) {
        throw new ApiError(400, 'Email already exists');
    }

    const leadId = await LeadModel.create(leadData);
    
    // Async operation handled properly, could be moved to a job queue
    emailService.sendWelcomeEmail(leadData.email).catch(console.error);

    return await LeadModel.findById(leadId);
};

module.exports = { createLead };
```

## What Improved?

1. **Separation of Concerns (MVC)**: The route only handles HTTP routing. The Controller handles HTTP req/res. The Service handles pure business logic.
2. **Validation**: Joi middleware validates input *before* it reaches the controller.
3. **Error Handling**: `catchAsync` removes `try/catch` boilerplate. Errors are thrown as `ApiError` and caught by a global middleware.
4. **Security**: Assuming `LeadModel.create` uses parameterized queries, SQL injection is prevented.
5. **Testability**: The `leadService.createLead` function can now be easily unit tested by mocking `LeadModel` and `emailService`, without needing a running Express server.
