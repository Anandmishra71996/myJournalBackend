import { Journal } from '../models/journal.model';
import { logger } from '../utils/logger';

export class JournalService {
    async createJournal(userId: string, journalData: any) {
        try {
            const journal = await Journal.create({
                userId,
                ...journalData,
            });

            return journal;
        } catch (error) {
            logger.error('Error creating journal:', error);
            throw error;
        }
    }

    async getJournals(
        userId: string,
        page: number = 1,
        limit: number = 20,
        startDate?: string,
        endDate?: string
    ) {
        const skip = (page - 1) * limit;
        const query: any = { userId };

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const [journals, total] = await Promise.all([
            Journal.find(query).sort({ date: -1 }).skip(skip).limit(limit),
            Journal.countDocuments(query),
        ]);

        return {
            journals,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    async getJournalById(journalId: string, userId: string) {
        return await Journal.findOne({ _id: journalId, userId });
    }

    async getTodayJournal(userId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return await Journal.findOne({
            userId,
            date: {
                $gte: today,
                $lt: tomorrow,
            },
        });
    }

    async getJournalByDate(userId: string, date: Date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return await Journal.findOne({
            userId,
            date: { $gte: startOfDay, $lte: endOfDay },
        });
    }

    async updateJournal(journalId: string, userId: string, updates: any) {
        const journal = await Journal.findOneAndUpdate(
            { _id: journalId, userId },
            { $set: updates },
            { new: true, runValidators: true }
        );

        return journal;
    }

    async deleteJournal(journalId: string, userId: string) {
        const journal = await Journal.findOneAndDelete({ _id: journalId, userId });

        if (!journal) {
            throw new Error('Journal not found');
        }

        return journal;
    }

    async getJournalsByDateRange(userId: string, startDate: Date, endDate: Date) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const journals = await Journal.find({
            userId,
            date: { $gte: start, $lte: end },
        }).sort({ date: 1 });

        return journals;
    }
}
