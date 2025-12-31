import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types/auth.types';

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    register = async (req: Request, res: Response) => {
        try {
            const { email, password, name } = req.body;

            const result = await this.userService.register(email, password, name);

            res.status(201).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            logger.error('Error in register:', error);
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to register user',
            });
        }
    };

    login = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;

            const result = await this.userService.login(email, password);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            logger.error('Error in login:', error);
            res.status(401).json({
                success: false,
                error: error.message || 'Invalid credentials',
            });
        }
    };

    getProfile = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id;

            const user = await this.userService.getUserById(userId!);

            res.status(200).json({
                success: true,
                data: user,
            });
        } catch (error) {
            logger.error('Error in getProfile:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch profile',
            });
        }
    };

    updateProfile = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id;
            const updates = req.body;

            const user = await this.userService.updateUser(userId!, updates);

            res.status(200).json({
                success: true,
                data: user,
            });
        } catch (error) {
            logger.error('Error in updateProfile:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update profile',
            });
        }
    };
}
