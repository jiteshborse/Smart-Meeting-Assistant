import dotenv from 'dotenv';
import path from 'path';

// Load env before importing service
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { aiService } from '../services/ai.service';

const sampleTranscript = `
Speaker A: Hi everyone, thanks for joining. Today we need to discuss the Q3 roadmap.
Speaker B: I think we should prioritize the mobile app update. Users are complaining about the bugs.
Speaker A: Agreed. Let's put that as P0. What about the new dashboard?
Speaker C: The dashboard is mostly done, just needs some QA. I can finish it by next week.
Speaker A: Great. So, action items: B, you lead the mobile update. C, finish the dashboard.
Speaker B: I'll need some help with the backend for the mobile app.
Speaker A: I'll assign Dave to help you.
`;

import fs from 'fs';

async function test() {
    const log = (msg: string) => {
        console.log(msg);
        fs.appendFileSync('result.txt', msg + '\n');
    };

    // Clear previous log
    fs.writeFileSync('result.txt', '');

    log('Testing AI Service...');
    log('API Key present: ' + !!process.env.GEMINI_API_KEY);
    log('Model: ' + process.env.GEMINI_MODEL);

    try {
        const result = await aiService.analyzeMeeting(sampleTranscript);
        log('Analysis Result:\n' + JSON.stringify(result, null, 2));
    } catch (error) {
        log('Test Failed: ' + error);
    }
}

test();
