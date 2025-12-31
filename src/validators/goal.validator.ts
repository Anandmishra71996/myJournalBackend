import Joi from 'joi';

const GOAL_TYPES = ['weekly', 'monthly', 'yearly'];
const GOAL_CATEGORIES = ['Health', 'Career', 'Learning', 'Mindset', 'Relationships', 'Personal'];
const GOAL_STATUSES = ['active', 'completed', 'paused', 'archived'];

export const createGoalSchema = Joi.object({
    title: Joi.string()
        .trim()
        .max(80)
        .required()
        .messages({
            'string.empty': 'Goal title is required',
            'string.max': 'Title must not exceed 80 characters',
        }),

    type: Joi.string()
        .valid(...GOAL_TYPES)
        .required()
        .messages({
            'any.required': 'Goal type is required',
            'any.only': 'Invalid goal type',
        }),

    category: Joi.string()
        .valid(...GOAL_CATEGORIES)
        .required()
        .messages({
            'any.required': 'Category is required',
            'any.only': 'Invalid category',
        }),

    why: Joi.string()
        .trim()
        .max(200)
        .optional()
        .allow('')
        .messages({
            'string.max': 'Why field must not exceed 200 characters',
        }),

    trackingMethods: Joi.array()
        .items(Joi.string())
        .max(3)
        .optional()
        .default([])
        .messages({
            'array.max': 'You can select a maximum of 3 tracking methods',
        }),

    journalSignals: Joi.array()
        .items(Joi.string())
        .max(3)
        .optional()
        .default([])
        .messages({
            'array.max': 'You can select a maximum of 3 journal signals',
        }),

    successDefinition: Joi.string()
        .trim()
        .optional()
        .allow(''),

    status: Joi.string()
        .valid(...GOAL_STATUSES)
        .optional()
        .default('active'),
});

export const updateGoalSchema = Joi.object({
    title: Joi.string()
        .trim()
        .max(80)
        .optional()
        .messages({
            'string.max': 'Title must not exceed 80 characters',
        }),

    type: Joi.string()
        .valid(...GOAL_TYPES)
        .optional()
        .messages({
            'any.only': 'Invalid goal type',
        }),

    category: Joi.string()
        .valid(...GOAL_CATEGORIES)
        .optional()
        .messages({
            'any.only': 'Invalid category',
        }),

    why: Joi.string()
        .trim()
        .max(200)
        .optional()
        .allow('')
        .messages({
            'string.max': 'Why field must not exceed 200 characters',
        }),

    trackingMethods: Joi.array()
        .items(Joi.string())
        .max(3)
        .optional()
        .messages({
            'array.max': 'You can select a maximum of 3 tracking methods',
        }),

    journalSignals: Joi.array()
        .items(Joi.string())
        .max(3)
        .optional()
        .messages({
            'array.max': 'You can select a maximum of 3 journal signals',
        }),

    successDefinition: Joi.string()
        .trim()
        .optional()
        .allow(''),

    status: Joi.string()
        .valid(...GOAL_STATUSES)
        .optional(),
});

export const updateStatusSchema = Joi.object({
    status: Joi.string()
        .valid(...GOAL_STATUSES)
        .required()
        .messages({
            'any.required': 'Status is required',
            'any.only': 'Invalid status',
        }),
});
