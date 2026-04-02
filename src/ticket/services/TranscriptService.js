const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

class TranscriptService {
    constructor() {
        const window = new JSDOM('').window;
        this.dompurify = createDOMPurify(window);
    }

    
    async generate(channel, ticket) {
        const messages = await channel.messages.fetch({ limit: 100 });
        const sortedMessages = messages.sort((a, b) => a.createdAt - b.createdAt);

        let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Transcript - #${ticket.ticketId}</title>
            <style>
                body { background: #36393f; color: #dcddde; font-family: sans-serif; padding: 20px; }
                .message { display: flex; margin-bottom: 15px; border-bottom: 1px solid #40444b; padding-bottom: 10px; }
                .avatar { width: 40px; height: 40px; border-radius: 50%; margin-right: 15px; }
                .content { flex: 1; }
                .author { font-weight: bold; color: #fff; margin-bottom: 5px; }
                .timestamp { font-size: 0.8em; color: #72767d; margin-left: 10px; }
                .text { line-height: 1.4; }
                .ai-badge { background: #5865F2; color: #fff; font-size: 0.7em; padding: 2px 5px; border-radius: 3px; margin-left: 5px; }
            </style>
        </head>
        <body>
            <h1>Transcript for Ticket #${ticket.ticketId}</h1>
            <p>User: ${ticket.userId} | Type: ${ticket.type} | Date: ${ticket.createdAt.toDateHandled?.() || ticket.createdAt}</p>
            <hr>
            <div id="messages">
        `;

        sortedMessages.forEach(msg => {
            const cleanContent = this.dompurify.sanitize(msg.content);
            const isAI = msg.author.bot && msg.reference;

            html += `
                <div class="message">
                    <img src="${msg.author.displayAvatarURL()}" class="avatar">
                    <div class="content">
                        <div class="author">
                            ${msg.author.tag} 
                            ${isAI ? '<span class="ai-badge">AI</span>' : ''}
                            <span class="timestamp">${msg.createdAt.toLocaleString()}</span>
                        </div>
                        <div class="text">${cleanContent || '*No text content*'}</div>
                    </div>
                </div>
            `;
        });

        html += `
            </div>
        </body>
        </html>
        `;

        const filename = `transcript-${ticket.ticketId}-${Date.now()}.html`;
        const dir = path.join(__dirname, '../../../transcripts');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        
        const filepath = path.join(dir, filename);
        fs.writeFileSync(filepath, html);

        return { filename, filepath };
    }
}

module.exports = new TranscriptService();

