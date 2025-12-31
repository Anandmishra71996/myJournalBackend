import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { registerSchema, loginSchema } from '../validators/user.validator';
import { profileSchema } from '../validators/profile.validator';

const router = Router();
const userController = new UserController();

router.post(
    '/register',
    validateRequest(registerSchema),
    userController.register
);

router.post(
    '/login',
    validateRequest(loginSchema),
    userController.login
);

router.get(
    '/profile',
    authenticate,
    userController.getProfile
);

router.put(
    '/profile',
    authenticate,
    validateRequest(profileSchema),
    userController.updateProfile
);

export default router;
