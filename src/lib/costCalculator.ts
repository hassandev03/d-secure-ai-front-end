/**
 * D-SecureAI — Cost Calculator (Frontend Mirror)
 * ===============================================
 * Mirrors the backend CostCalculator (Module H, implementation_plan_backend_modules.md).
 * All credit values displayed across every portal (SA / OA / DA / Employee) must be
 * derived through this module — never invented as arbitrary integers.
 *
 * Unit: USD (stored as NUMERIC(10,6) on the backend, shown to 4 d.p. in most UI).
 *
 * Formula:
 *   Total cost per interaction =
 *       ① LLM Input Cost        (input_words → tokens → per-1M-token price)
 *     + ② LLM Output Cost       (output_words → tokens → per-1M-token price)
 *     + ③ Anonymization Cost    ($0.000001 per input word)
 *     + ④ De-anonymization Cost ($0.0000015 per output word)
 *     + ⑤ File Extraction Cost  ($0.0000002 per extracted word)
 *     + ⑥ STT Surcharge         (Speech-to-text $0.015/min)
 */

// ─── Platform cost config (matches platform_cost_config table defaults) ────────

export const PLATFORM_CONFIG = {
    /** Industry-standard word-to-token ratio (1 word ≈ 1.33 tokens) */
    WORDS_TO_TOKENS_RATIO: 1.33,

    /** ③ Anonymization fee per input word (USD) */
    ANONYMIZATION_COST_PER_WORD: 0.000001,

    /** ④ De-anonymization fee per output word (USD) */
    DEANONYMIZATION_COST_PER_WORD: 0.0000015,

    /** ⑤ Per-word fee on extracted file text (USD) — no flat file fee */
    FILE_PER_WORD_FEE: 0.0000002,

    /** ⑥ Speech-to-text fee per minute (USD) */
    STT_PER_MINUTE_FEE: 0.015,

    /** 
     * Conversion rate: 1 USD = 5,000 Compute Units (CU).
     * Used for display purposes so users see whole numbers (e.g., 75 CU) 
     * instead of fractional dollars (e.g., $0.015).
     */
    CU_MULTIPLIER: 5000,
} as const;

// ─── LLM model pricing (matches llm_model_pricing table SA-configured defaults) ─

/** Per-1M-token pricing for each model (input, output). USD. */
export const MODEL_PRICING: Record<string, { input: number; output: number; displayName: string }> = {
    // OpenAI (Azure)
    'gpt-4.1':          { input: 2.00,  output:  8.00, displayName: 'GPT-4.1'           },

    // Anthropic (Claude 4.x family)
    'claude-opus-4-5':   { input: 15.00, output: 75.00, displayName: 'Claude Opus'  },
    'claude-sonnet-4-5': { input: 3.00,  output: 15.00, displayName: 'Claude Sonnet' },
    'claude-haiku-4-5':  { input: 0.25,  output:  1.25, displayName: 'Claude Haiku'  },

    // Google (Gemini)
    'gemini-3.1-flash-preview': { input: 0.1,   output: 0.40, displayName: 'Gemini 3.1 Flash' },
    'gemini-2.5-flash':         { input: 0.075, output: 0.30, displayName: 'Gemini 2.5 Flash' },
};

// ─── Subscription plan budgets ────────────────────────────────────────────────

export const PLAN_BUDGETS: Record<string, number> = {
    FREE:       0.50,
    PRO:       25.00,
    MAX:       80.00,
    ENTERPRISE: 500.00, // per-department budget, total org is higher
};

// ─── Core cost calculation functions ─────────────────────────────────────────

/**
 * Count words in a string (simple whitespace split, matching backend).
 */
export function countWords(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Convert word count to token count using the standard ratio.
 */
export function wordsToTokens(words: number): number {
    return words * PLATFORM_CONFIG.WORDS_TO_TOKENS_RATIO;
}

export interface LLMCostResult {
    inputCost: number;
    outputCost: number;
}

/**
 * ① + ② Calculate LLM API cost for a given model and word counts.
 * This is the direct mirror of CostCalculator.calculate_llm_cost().
 */
export function calculateLLMCost(
    modelKey: string,
    inputWords: number,
    outputWords: number,
): LLMCostResult {
    const pricing = MODEL_PRICING[modelKey] ?? MODEL_PRICING['gpt-4.1'];

    const inputTokens  = wordsToTokens(inputWords);
    const outputTokens = wordsToTokens(outputWords);

    return {
        inputCost:  (inputTokens  / 1_000_000) * pricing.input,
        outputCost: (outputTokens / 1_000_000) * pricing.output,
    };
}

export interface CostBreakdown {
    inputWords:           number;
    outputWords:          number;
    llmInputCost:         number;
    llmOutputCost:        number;
    anonymizationCost:    number;
    deanonymizationCost:  number;
    fileCost:             number;
    featureCost:          number;
    /** Sum of all items. This is what gets deducted from the quota ledger. */
    totalCost:            number;
}

export interface InteractionParams {
    modelKey:       string;
    inputWords:     number;
    outputWords:    number;
    /** Total word count across all attached files (if any) */
    fileWordCount?: number;
    /** Speech-to-text duration in minutes */
    sttMinutes?:    number;
}

/**
 * Full cost calculation for a single interaction.
 * Mirrors CostCalculator.calculate_interaction_cost().
 *
 * @example
 * calculateInteractionCost({ modelKey:'gpt-4.1', inputWords:200, outputWords:500 })
 */
export function calculateInteractionCost(params: InteractionParams): CostBreakdown {
    const {
        modelKey,
        inputWords,
        outputWords,
        fileWordCount = 0,
        sttMinutes    = 0,
    } = params;

    const cfg = PLATFORM_CONFIG;

    // ① + ② LLM cost (files counted as additional input words)
    const totalInputWords = inputWords + fileWordCount;
    const { inputCost, outputCost } = calculateLLMCost(modelKey, totalInputWords, outputWords);

    // ③ Anonymization (on input text + file text)
    const anonymizationCost = totalInputWords * cfg.ANONYMIZATION_COST_PER_WORD;

    // ④ De-anonymization (on LLM output)
    const deanonymizationCost = outputWords * cfg.DEANONYMIZATION_COST_PER_WORD;

    // ⑤ File extraction — per-word only, no flat fee
    const fileCost = fileWordCount > 0 ? fileWordCount * cfg.FILE_PER_WORD_FEE : 0;

    // ⑥ STT surcharge
    const featureCost = sttMinutes > 0 ? cfg.STT_PER_MINUTE_FEE * sttMinutes : 0;

    const totalCost = inputCost + outputCost + anonymizationCost + deanonymizationCost + fileCost + featureCost;

    return {
        inputWords:          totalInputWords,
        outputWords,
        llmInputCost:        round(inputCost, 8),
        llmOutputCost:       round(outputCost, 8),
        anonymizationCost:   round(anonymizationCost, 8),
        deanonymizationCost: round(deanonymizationCost, 8),
        fileCost:            round(fileCost, 8),
        featureCost:         round(featureCost, 8),
        totalCost:           round(totalCost, 6),
    };
}

// ─── Mock data helpers ────────────────────────────────────────────────────────
// These helpers allow service files to derive realistic, formula-consistent
// credit amounts for mock employees and usage trends — no more ad-hoc numbers.

/**
 * Estimate the monthly credit consumption for a mock employee given:
 * - typical daily interactions (queries/day on workdays)
 * - average prompt/response length for their role
 * - model preference for their department
 *
 * This gives every mock `creditsUsed` value a real physical meaning.
 */
export interface MockEmployeeUsageProfile {
    queriesPerDay:    number;
    avgInputWords:    number;
    avgOutputWords:   number;
    modelKey:         string;
    fileQueryPct?:    number; // 0–1, fraction of queries that include a file
    avgFileWords?:    number; // words in attached file
    workingDaysUsed?: number; // default 22 (full month)
}

export function estimateMonthlyCredits(profile: MockEmployeeUsageProfile): number {
    const {
        queriesPerDay,
        avgInputWords,
        avgOutputWords,
        modelKey,
        fileQueryPct    = 0,
        avgFileWords    = 0,
        workingDaysUsed = 22,
    } = profile;

    const totalQueries = queriesPerDay * workingDaysUsed;

    let total = 0;
    for (let i = 0; i < totalQueries; i++) {
        const hasFile = Math.random() < fileQueryPct;
        const cost = calculateInteractionCost({
            modelKey,
            inputWords:    avgInputWords,
            outputWords:   avgOutputWords,
            fileWordCount: hasFile ? avgFileWords : 0,
        });
        total += cost.totalCost;
    }

    return round(total, 4);
}

/**
 * Deterministic (seeded) credit estimate — no Math.random(), so the value
 * is always the same for the same profile. Useful for mock data that must be
 * stable across re-renders.
 *
 * Uses the formula's *expected value* (no random variation).
 */
export function estimateMonthlyCreditsFixed(profile: MockEmployeeUsageProfile): number {
    const {
        queriesPerDay,
        avgInputWords,
        avgOutputWords,
        modelKey,
        fileQueryPct    = 0,
        avgFileWords    = 0,
        workingDaysUsed = 22,
    } = profile;

    const totalQueries = queriesPerDay * workingDaysUsed;

    // Expected value per query (weighted by file usage rate)
    const plainCost = calculateInteractionCost({ modelKey, inputWords: avgInputWords, outputWords: avgOutputWords });
    const fileCost  = calculateInteractionCost({
        modelKey,
        inputWords:    avgInputWords,
        outputWords:   avgOutputWords,
        fileWordCount: avgFileWords,
    });

    const expectedPerQuery =
        plainCost.totalCost * (1 - fileQueryPct)
      + fileCost.totalCost  * fileQueryPct;

    return round(expectedPerQuery * totalQueries, 4);
}

/**
 * Build a daily credit usage series for the last N days.
 * The daily values are derived from the total monthly budget consumed,
 * not from arbitrary multipliers — weekday/weekend variation is applied.
 */
export function buildDailyCredits(
    monthlyTotal: number,
    days: number,
): Array<{ day: string; credits: number }> {
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // Average over 22 workdays + 8 weekend days, weekends are ~20% of workday
    // So: total = 22×X + 8×0.2X → X = total / (22 + 1.6) = total / 23.6
    const workdayAvg  = monthlyTotal / 23.6;
    const weekendAvg  = workdayAvg * 0.2;

    const today = new Date();
    return Array.from({ length: days }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (days - 1 - i));
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const base = isWeekend ? weekendAvg : workdayAvg;
        return {
            day:     DAY_NAMES[d.getDay()],
            credits: round(base, 4),
        };
    });
}

/**
 * Build a dated trend series (with date labels like "Apr 14").
 */
export function buildDatedTrend(
    monthlyTotal: number,
    days: number,
): Array<{ date: string; creditsUsed: number }> {
    const workdayAvg = monthlyTotal / 23.6;
    const weekendAvg = workdayAvg * 0.2;
    const today = new Date();
    return Array.from({ length: days }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (days - 1 - i));
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        return {
            date:        d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            creditsUsed: round(isWeekend ? weekendAvg : workdayAvg, 4),
        };
    });
}

// ─── Display helpers ──────────────────────────────────────────────────────────

/** Format a CU credit value for display: "75 CU" (from $0.015) */
export function formatCredits(usd: number, decimals = 1): string {
    const cu = usd * PLATFORM_CONFIG.CU_MULTIPLIER;
    // For small fractional CUs, show 1 decimal, else 0
    const fraction = cu > 0 && cu < 10 ? 1 : 0;
    return `${cu.toLocaleString(undefined, { minimumFractionDigits: fraction, maximumFractionDigits: decimals })} CU`;
}

/** Format a CU credit value compactly: "75 CU" */
export function formatCreditsShort(usd: number): string {
    const cu = usd * PLATFORM_CONFIG.CU_MULTIPLIER;
    return `${cu.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} CU`;
}

/** Format a large credit budget: "250,000 CU" */
export function formatBudget(usd: number): string {
    const cu = usd * PLATFORM_CONFIG.CU_MULTIPLIER;
    return `${cu.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} CU`;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function round(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}
