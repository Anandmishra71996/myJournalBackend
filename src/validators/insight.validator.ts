import Joi from 'joi';

export const getInsightSchema = Joi.object({
    weekStart: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .required()
        .messages({
            'string.pattern.base': 'weekStart must be in YYYY-MM-DD format',
            'any.required': 'weekStart is required',
        }),
});

export const generateInsightSchema = Joi.object({
    weekStart: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .required()
        .messages({
            'string.pattern.base': 'weekStart must be in YYYY-MM-DD format',
            'any.required': 'weekStart is required',
        }),
});
