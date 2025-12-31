export type IntentType =
    | 'Shopping'
    | 'Creative'
    | 'Technical'
    | 'Research'
    | 'General';

export interface IntentResult {
    type: IntentType;
    confidence: number;
    description: string;
    subType?: string;
}

import { detectShoppingIntent } from './shoppingAgentTrigger';

export function detectIntent(prompt: string): IntentResult {
    const lowerPrompt = prompt.toLowerCase().trim();

    // 1. Shopping Intent (using existing logic)
    const shoppingIntent = detectShoppingIntent(prompt);
    if (shoppingIntent) {
        return {
            type: 'Shopping',
            confidence: 0.9,
            description: shoppingIntent.description,
            subType: shoppingIntent.type
        };
    }

    // 2. Technical / Coding Intent
    if (
        /(code|program|script|debug|error|function|class|api|database|sql|react|nextjs|python|javascript|typescript|how to build|implementation)/i.test(lowerPrompt) ||
        /(write a|create a|fix the|explain the) (code|script|function)/i.test(lowerPrompt)
    ) {
        return {
            type: 'Technical',
            confidence: 0.85,
            description: 'User is asking for technical or coding assistance.'
        };
    }

    // 3. Creative / Design Intent
    if (
        /(design|logo|brand|creative|story|poem|write a story|draw|paint|sketch|aesthetic|style)/i.test(lowerPrompt) ||
        /(make a|create a|generate a) (logo|design|story|poem)/i.test(lowerPrompt)
    ) {
        return {
            type: 'Creative',
            confidence: 0.8,
            description: 'User is expressing a creative or design-related need.'
        };
    }

    // 4. Research / Analysis Intent
    if (
        /(research|analyze|deep dive|latest news on|current state of|summary of|find papers|scholar)/i.test(lowerPrompt) ||
        /(what is the|who is the|tell me more about|history of)/i.test(lowerPrompt)
    ) {
        return {
            type: 'Research',
            confidence: 0.75,
            description: 'User is seeking research or detailed analysis.'
        };
    }

    // 5. Default/General
    return {
        type: 'General',
        confidence: 0.5,
        description: 'No specific intent detected. General conversation.'
    };
}
