import * as v from 'valibot';

export const addFoodSchema = v.object({
    selectedServingId: v.pipe(
        v.string(),
        v.minLength(1, 'Please select a serving size')
    ),
    customAmount: v.optional(
        v.pipe(
            v.string(),
            v.transform(input => input === '' ? undefined : input),
            v.optional(
                v.pipe(
                    v.string(),
                    v.regex(/^\d*\.?\d+$/, 'Amount must be a valid number'),
                    v.transform(Number),
                    v.number(),
                    v.minValue(0.1, 'Amount must be greater than 0')
                )
            )
        )
    ),
    customUnit: v.optional(v.string()),
    selectedMeal: v.pipe(
        v.string(),
        v.minLength(1, 'Please select a meal type')
    )
});