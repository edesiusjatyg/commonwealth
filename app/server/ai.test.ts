import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chat, generateInsight, getInsight, getSentiment } from './ai';
import axios from 'axios';

vi.mock('axios');

describe('AI Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('chat', () => {
        it('should return a reply and charts for valid input', async () => {
            // Chat is currently a mock implementation in source, so we test that behavior
            const input = { message: 'Show me spending' };
            const result = await chat(input);

            expect(result.reply).toContain("I've received your message");
            expect(result.charts).toBeDefined();
        });

        it('should return error for invalid input', async () => {
            const result = await chat({ message: '' });
            console.log('Chat result for invalid input:', JSON.stringify(result, null, 2));
            expect(result.error).toBeDefined();
        });
    });

    describe('generateInsight', () => {
        it('should call insights service and return data', async () => {
            const mockResponse = { data: { insight_text: 'Good job', confidence: 0.9 } };
            (axios.post as any).mockResolvedValue(mockResponse);

            const input = { userId: 'u1', transactionsData: [] };
            const result = await generateInsight(input);

            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/insights/generate'),
                expect.anything(),
                expect.objectContaining({ params: { user_id: 'u1' } })
            );
            expect(result).toEqual(mockResponse.data);
        });

        it('should handle service error', async () => {
            (axios.post as any).mockRejectedValue(new Error('Service down'));

            const result = await generateInsight({ userId: 'u1', transactionsData: [] });

            expect(result.error).toBe('AI Insights Service unreachable');
        });
    });

    describe('getSentiment', () => {
        it('should call sentiment service', async () => {
            const mockResponse = { data: { sentiment: 'bullish' } };
            (axios.post as any).mockResolvedValue(mockResponse);

            const result = await getSentiment({ token: 'ETH' });

            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/api/v1/sentiment'),
                expect.objectContaining({ token: 'ETH' })
            );
            expect(result).toEqual(mockResponse.data);
        });
    });
});
