import Joi from 'joi';

// Valid options for profile fields
const VALID_WHY_USING_APP = [
    'Improve consistency',
    'Mental clarity',
    'Goal tracking',
    'Self awareness',
    'Reduce stress',
    'Personal growth',
];

const VALID_FOCUS_AREAS = [
    'Focus',
    'Discipline',
    'Health',
    'Career',
    'Learning',
    'Mindset',
    'Relationships',
];

const VALID_LIFE_PHASES = [
    'Student',
    'Working professional',
    'Founder',
    'Career transition',
    'Parent',
    'Other',
];

const VALID_CONSTRAINTS = ['Time', 'Energy', 'Motivation', 'Stress', 'Clarity'];

const VALID_INSIGHT_STYLES = ['gentle', 'practical', 'analytical'];

const VALID_INSIGHT_FREQUENCIES = ['weekly', 'monthly', 'on-demand'];

export const profileSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Name is required',
            'string.min': 'Name must be at least 2 characters',
            'string.max': 'Name must not exceed 100 characters',
        }),

    current_role: Joi.string()
        .trim()
        .max(100)
        .optional()
        .allow('')
        .messages({
            'string.max': 'Current role must not exceed 100 characters',
        }),

    whyUsingApp: Joi.string()
        .valid(...VALID_WHY_USING_APP)
        .required()
        .messages({
            'any.required': 'Please select why you are using this app',
            'any.only': 'Invalid option for why you are using this app',
        }),

    focusAreas: Joi.array()
        .items(Joi.string().valid(...VALID_FOCUS_AREAS))
        .min(1)
        .max(3)
        .required()
        .messages({
            'array.min': 'Please select at least one focus area',
            'array.max': 'You can select a maximum of 3 focus areas',
            'any.required': 'Please select at least one focus area',
            'any.only': 'Invalid focus area selected',
        }),

    lifePhase: Joi.string()
        .valid(...VALID_LIFE_PHASES)
        .optional()
        .allow('')
        .messages({
            'any.only': 'Invalid life phase selected',
        }),

    biggestConstraint: Joi.string()
        .valid(...VALID_CONSTRAINTS)
        .optional()
        .allow('')
        .messages({
            'any.only': 'Invalid constraint selected',
        }),

    insightStyle: Joi.string()
        .valid(...VALID_INSIGHT_STYLES)
        .required()
        .messages({
            'any.required': 'Please select an insight style',
            'any.only': 'Invalid insight style selected',
        }),

    insightFrequency: Joi.string()
        .valid(...VALID_INSIGHT_FREQUENCIES)
        .required()
        .messages({
            'any.required': 'Please select an insight frequency',
            'any.only': 'Invalid insight frequency selected',
        }),

    aiEnabled: Joi.boolean()
        .required()
        .messages({
            'any.required': 'AI enabled field is required',
            'boolean.base': 'AI enabled must be true or false',
        }),

    avatar: Joi.string().optional().allow(''),
    isProfileCompleted: Joi.boolean().optional(),
});
