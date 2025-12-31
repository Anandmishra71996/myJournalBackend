import Joi from 'joi';

export const chatValidationSchema = Joi.object({
    message: Joi.string().required().min(1).max(5000),
    conversationId: Joi.string().optional(),
    systemPrompt: Joi.string().optional().max(2000),
});
