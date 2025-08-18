const Joi = require('joi');

// Validation schemas
const schemas = {
  getTopDriver: Joi.object({
    trip_start: Joi.date().iso().required().messages({
      'date.base': 'trip_start must be a valid date',
      'date.iso': 'trip_start must be in ISO format',
      'any.required': 'trip_start is required'
    }),
    trip_end: Joi.date().iso().min(Joi.ref('trip_start')).required().messages({
      'date.base': 'trip_end must be a valid date',
      'date.iso': 'trip_end must be in ISO format',
      'date.min': 'trip_end must be after trip_start',
      'any.required': 'trip_end is required'
    })
  }),

  getTopGuide: Joi.object({
    trip_start: Joi.date().iso().required().messages({
      'date.base': 'trip_start must be a valid date',
      'date.iso': 'trip_start must be in ISO format',
      'any.required': 'trip_start is required'
    }),
    trip_end: Joi.date().iso().min(Joi.ref('trip_start')).required().messages({
      'date.base': 'trip_end must be a valid date',
      'date.iso': 'trip_end must be in ISO format',
      'date.min': 'trip_end must be after trip_start',
      'any.required': 'trip_end is required'
    })
  }),

  assignDriver: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'email must be a valid email address',
      'any.required': 'email is required'
    }),
    trip_id: Joi.string().trim().min(1).required().messages({
      'string.empty': 'trip_id cannot be empty',
      'string.min': 'trip_id must be at least 1 character long',
      'any.required': 'trip_id is required'
    }),
    start_date: Joi.date().iso().required().messages({
      'date.base': 'start_date must be a valid date',
      'date.iso': 'start_date must be in ISO format',
      'any.required': 'start_date is required'
    }),
    end_date: Joi.date().iso().min(Joi.ref('start_date')).required().messages({
      'date.base': 'end_date must be a valid date',
      'date.iso': 'end_date must be in ISO format',
      'date.min': 'end_date must be after start_date',
      'any.required': 'end_date is required'
    })
  }),

  assignGuide: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'email must be a valid email address',
      'any.required': 'email is required'
    }),
    trip_id: Joi.string().trim().min(1).required().messages({
      'string.empty': 'trip_id cannot be empty',
      'string.min': 'trip_id must be at least 1 character long',
      'any.required': 'trip_id is required'
    }),
    start_date: Joi.date().iso().required().messages({
      'date.base': 'start_date must be a valid date',
      'date.iso': 'start_date must be in ISO format',
      'any.required': 'start_date is required'
    }),
    end_date: Joi.date().iso().min(Joi.ref('start_date')).required().messages({
      'date.base': 'end_date must be a valid date',
      'date.iso': 'end_date must be in ISO format',
      'date.min': 'end_date must be after start_date',
      'any.required': 'end_date is required'
    })
  }),

  createDriverScore: Joi.object({
    email: Joi.string().email().required(),
    rating: Joi.number().min(0).max(5).required(),
    active: Joi.boolean().required(),
    banned: Joi.boolean().required(),
    newDriver: Joi.boolean().required(),
    first10Rides: Joi.number().integer().min(1).max(10).required(),
    penalty: Joi.number().integer().min(0).max(100).required()
  }),

  createGuideScore: Joi.object({
    email: Joi.string().email().required(),
    rating: Joi.number().min(0).max(5).required(),
    active: Joi.boolean().required(),
    banned: Joi.boolean().required(),
    newDriver: Joi.boolean().required(),
    first10Rides: Joi.number().integer().min(1).max(10).required(),
    penalty: Joi.number().integer().min(0).max(100).required()
  })
};

/**
 * Creates a validation middleware for the specified schema
 * @param {string} schemaName - Name of the schema to use
 * @param {string} property - Property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
function validate(schemaName, property = 'body') {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      return res.status(500).json({
        success: false,
        message: 'Validation schema not found',
        error: `Schema '${schemaName}' does not exist`
      });
    }

    const { error, value } = schema.validate(req[property], { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      });
    }

    // Replace the original data with the validated and sanitized data
    req[property] = value;
    next();
  };
}

module.exports = {
  validate,
  schemas
};
