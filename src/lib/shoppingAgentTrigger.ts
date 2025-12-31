export type ShoppingTriggerType =
    | 'ProductRecommendation'
    | 'BudgetPrice'
    | 'ProductComparison'
    | 'IntentToBuy'
    | 'CategorySearch'
    | 'PersonalNeeds'
    | 'StylePreference'
    | 'GiftOccasion'
    | 'ShoppingTroubles'
    | 'AvailabilityBestDeal'
    | 'OnlineStoreIntent';

export interface BoxShoppingTrigger {
    type: ShoppingTriggerType;
    description: string;
}

export function detectShoppingIntent(prompt: string): BoxShoppingTrigger | null {
    const lowerPrompt = prompt.toLowerCase().trim();

    // 1. Product Recommendation Trigger
    // Examples: "Recommend a good phone", "Suggest best shoes"
    if (
        /(recommend|suggest|what (is|are) (good|best)|need a (good|decent)|looking for (good|best))/i.test(lowerPrompt) &&
        !lowerPrompt.includes('book') && !lowerPrompt.includes('movie') // Simple exclusion to avoid general non-shopping recs if needed
    ) {
        return { type: 'ProductRecommendation', description: 'User asked for product recommendations.' };
    }

    // 2. Budget / Price Trigger
    // Examples: "under 20000", "below 500", "budget of"
    if (
        /(under|below|less than|cheaper than|budget (is|of)|price (limit|range)|max price)/i.test(lowerPrompt) &&
        /\d+/.test(lowerPrompt) // Must contain a number
    ) {
        return { type: 'BudgetPrice', description: 'User specified a budget or price limit.' };
    }

    // 3. Product Comparison Trigger
    // Examples: "vs", "compare", "which is better", "or" (in context of two products)
    if (
        /( vs | versus |compare|which (is|one is) (better|faster|cheaper)|(difference|which) (between|should i buy|should i choose))/i.test(lowerPrompt)
    ) {
        return { type: 'ProductComparison', description: 'User is comparing products.' };
    }

    // 4. Intent to Buy / "What should I choose?" Trigger
    // Examples: "what should i buy", "help me choose", "planning to buy", "want to buy"
    if (
        /(what should i (buy|choose|get)|help me (choose|decide|pick)|(want|planning|thinking) to (buy|purchase|get a new)|i need to buy)/i.test(lowerPrompt)
    ) {
        return { type: 'IntentToBuy', description: 'User expressed direct intent to buy or choose.' };
    }

    // 5. Category Search Trigger
    // Examples: "good perfumes", "best office chairs", "trending jackets"
    // This is a bit broader, relying on structure like "Adjective + Category" or "Category for..."
    if (
        /(good|best|top|trending|popular|cool|nice) (perfumes|chairs|jackets|phones|laptops|shoes|watches|bags|clothes|gadgets|accessories)/i.test(lowerPrompt) ||
        /(show me|find me) (some|good|best|trending)/i.test(lowerPrompt)
    ) {
        return { type: 'CategorySearch', description: 'User searched for a product category.' };
    }

    // 6. Personal Needs / Use-Case Trigger
    // Examples: "shoes for gym", "laptop for editing", "bag for college"
    if (
        /(for (gym|college|school|work|office|gaming|editing|coding|programming|running|travel|hiking|biking|daily use))/i.test(lowerPrompt) ||
        /(shoes|laptop|bag|phone|watch) for /i.test(lowerPrompt)
    ) {
        return { type: 'PersonalNeeds', description: 'User specified a specific use-case.' };
    }

    // 7. Style / Preference Trigger
    // Examples: "black shoes", "premium look", "minimalist", "trendy", "oversized"
    if (
        /(black|white|red|blue|green|yellow|pink|leather|metal|premium|minimalist|trendy|oversized|slim|compact|heavy|lightweight|waterproof|wireless) (shoes|watch|phone|laptop|bag|jacket|shirt|t-shirt)/i.test(lowerPrompt)
    ) {
        return { type: 'StylePreference', description: 'User described a style or specific preference.' };
    }

    // 8. Gift / Occasion Trigger
    // Examples: "gift ideas", "gift for", "anniversary", "birthday present"
    if (
        /(gift|present) (ideas|for|suggestion)|(birthday|anniversary|wedding|party|festival) (gift|present|suggestion)/i.test(lowerPrompt)
    ) {
        return { type: 'GiftOccasion', description: 'User is looking for a gift or shopping for an occasion.' };
    }

    // 9. Shopping Troubles / Confusion Trigger
    // Examples: "confused", "don't know what to buy", "too many options", "help me decide"
    if (
        /(confused|don't know what to (buy|get)|too many (options|choices)|can't decide|hard to choose|help me decide)/i.test(lowerPrompt)
    ) {
        return { type: 'ShoppingTroubles', description: 'User is confused or seeks guidance.' };
    }

    // 10. Availability / Best Deal Trigger
    // Examples: "best deals", "cheapest", "discount", "sale", "available"
    if (
        /(best (deal|offer|price)|cheapest|discount|sale|available|promo code|coupon|lowest price)/i.test(lowerPrompt)
    ) {
        return { type: 'AvailabilityBestDeal', description: 'User is looking for deals or availability.' };
    }

    // 11. Online Store Intent Trigger
    // Examples: "help me shop", "find on amazon", "browse shoes", "buy online"
    if (
        /(help me shop|find (me )?something on (amazon|flipkart|myntra|online)|browse (shoes|clothes|gadgets)|buy (it )?online|where can i buy)/i.test(lowerPrompt)
    ) {
        return { type: 'OnlineStoreIntent', description: 'User explicitly expressed intent to shop online.' };
    }

    return null;
}
