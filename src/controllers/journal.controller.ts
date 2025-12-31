import { Response } from 'express';
import { JournalService } from '../services/journal.service';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types/auth.types';

export class JournalController {
    private journalService: JournalService;

    constructor() {
        this.journalService = new JournalService();
    }

    createJournal = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id;
            const journalData = req.body;

            const journal = await this.journalService.createJournal(userId!, journalData);

            res.status(201).json({
                success: true,
                data: journal,
            });
        } catch (error) {
            logger.error('Error in createJournal:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create journal entry',
            });
        }
    };

    getJournals = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id;
            const { page = 1, limit = 20, startDate, endDate } = req.query;

            const journals = await this.journalService.getJournals(
                userId!,
                Number(page),
                Number(limit),
                startDate as string,
                endDate as string
            );

            res.status(200).json({
                success: true,
                data: journals,
            });
        } catch (error) {
            logger.error('Error in getJournals:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch journals',
            });
        }
    };

    getJournalById = async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            const journal = await this.journalService.getJournalById(id, userId!);

            if (!journal) {
                return res.status(404).json({
                    success: false,
                    error: 'Journal not found',
                });
            }

            res.status(200).json({
                success: true,
                data: journal,
            });
        } catch (error) {
            logger.error('Error in getJournalById:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch journal',
            });
        }
    };

    getTodayJournal = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id;
            const journal = await this.journalService.getTodayJournal(userId!);

            res.status(200).json({
                success: true,
                data: journal,
            });
        } catch (error) {
            logger.error('Error in getTodayJournal:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch today\'s journal',
            });
        }
    };

    getJournalByDate = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id;
            const { date } = req.query;

            if (!date) {
                return res.status(400).json({
                    success: false,
                    error: 'Date parameter is required',
                });
            }

            const journal = await this.journalService.getJournalByDate(userId!, new Date(date as string));

            res.status(200).json({
                success: true,
                data: journal,
            });
        } catch (error) {
            logger.error('Error in getJournalByDate:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch journal by date',
            });
        }
    };

    updateJournal = async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const updates = req.body;

            const journal = await this.journalService.updateJournal(id, userId!, updates);

            if (!journal) {
                return res.status(404).json({
                    success: false,
                    error: 'Journal not found',
                });
            }

            res.status(200).json({
                success: true,
                data: journal,
            });
        } catch (error) {
            logger.error('Error in updateJournal:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update journal',
            });
        }
    };

    deleteJournal = async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            await this.journalService.deleteJournal(id, userId!);

            res.status(200).json({
                success: true,
                message: 'Journal deleted successfully',
            });
        } catch (error) {
            logger.error('Error in deleteJournal:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete journal',
            });
        }
    };

    getWeeklyJournals = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id;
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    error: 'startDate and endDate parameters are required',
                });
            }

            const journals = await this.journalService.getJournalsByDateRange(
                userId!,
                new Date(startDate as string),
                new Date(endDate as string)
            );

            res.status(200).json({
                success: true,
                data: journals,
            });
        } catch (error) {
            logger.error('Error in getWeeklyJournals:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch weekly journals',
            });
        }
    };

    getMonthlyJournals = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id;
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    error: 'startDate and endDate parameters are required',
                });
            }

            const journals = await this.journalService.getJournalsByDateRange(
                userId!,
                new Date(startDate as string),
                new Date(endDate as string)
            );

            res.status(200).json({
                success: true,
                data: journals,
            });
        } catch (error) {
            logger.error('Error in getMonthlyJournals:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch monthly journals',
            });
        }
    };
}
