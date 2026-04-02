const Groq = require('groq-sdk');

const contextCache = new Map();

class GroqService {
    constructor() {
        this.groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });
        this.model = 'llama-3.3-70b-versatile';
    }

    
    async generateResponse(ticketId, messages, mode = 'hybrid') {
        let systemPrompt = `You are Zenith AI, a professional support assistant.`;
        
        if (mode === 'auto') {
            systemPrompt += `\n- You are operating in FULL AUTOPILOT mode.
            - You are the SOLE support agent for this ticket. DO NOT tell the user to wait for human staff, as they are not coming.
            - Your goal is to completely resolve the user's issue 100% on your own.
            - Provide deep technical troubleshooting, structured answers, and finalize the resolution.
            - You can use Discord markdown (bold, codeblocks) to organize your response.
            - Be highly intelligent and definitive.`;
        } else {
            systemPrompt += `\n- You are operating in HYBRID mode. Your main priority is to let the user know that human staff will arrive shortly.
            - Answer their question concisely if you can, but ALWAYS remind them to wait for a human staff member.
            - If you don't know the answer, just tell them staff will help them soon.
            - Keep responses brief and strictly professional.`;
        }

        systemPrompt += `\n- Maintain context from previous messages.`;

        try {
            const completion = await this.groq.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages
                ],
                model: this.model,
                temperature: 0.7,
                max_tokens: 1024
            });

            return completion.choices[0].message.content;
        } catch (err) {
            console.error('[GROQ AI ERROR]', err);
            return null;
        }
    }

    
    async analyzeTicket(initialIssue) {
        const analysisPrompt = `Analyze the following support ticket issue and return a JSON object with:
        1. tags: Array of strings (e.g., ["billing", "bug", "support"])
        2. priority: One of "low", "medium", "high"
        3. category: Suggested category name
        
        Issue: "${initialIssue}"
        
        Return ONLY valid JSON.`;

        try {
            const completion = await this.groq.chat.completions.create({
                messages: [{ role: 'user', content: analysisPrompt }],
                model: 'llama-3.1-8b-instant',
                response_format: { type: 'json_object' }
            });

            return JSON.parse(completion.choices[0].message.content);
        } catch (err) {
            console.error('[GROQ ANALYSIS ERROR]', err);
            return { tags: ['General'], priority: 'low', category: 'Support' };
        }
    }

    
    async generateSummary(messages) {
        const summaryPrompt = `Summarize the following support conversation into a professional resolution summary.
        Include:
        1. Original Issue
        2. Resolution/Outcome
        
        Conversation:
        ${messages.map(m => `${m.role}: ${m.content}`).join('\n')}
        
        Keep it under 200 words.`;

        try {
            const completion = await this.groq.chat.completions.create({
                messages: [{ role: 'user', content: summaryPrompt }],
                model: 'llama-3.1-8b-instant'
            });

            return completion.choices[0].message.content;
        } catch (err) {
            console.error('[GROQ SUMMARY ERROR]', err);
            return 'Resolution provided by staff.';
        }
    }

    
    async getContext(channelId, limit = 15) {
        const context = contextCache.get(channelId) || [];
        return context.slice(-limit);
    }

    async saveContext(channelId, role, content) {
        let context = contextCache.get(channelId) || [];
        context.push({ role, content });
        contextCache.set(channelId, context.slice(-30));
    }
}

module.exports = new GroqService();

