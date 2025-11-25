import * as v from "valibot";

const WeightEntrySchema = v.object({
    weight: v.pipe(
        v.string("Weight is required"),
        v.nonEmpty("Weight cannot be empty"),
        v.regex(/^\d+(\.\d{1,2})?$/, "Weight must be a valid number with up to 2 decimal places"),
        v.transform(parseFloat),
        v.number("Weight must be a valid number"),
        v.minValue(20, "Weight must be at least 20 kg"),
        v.maxValue(500, "Weight cannot exceed 500 kg")
    ),
    recorded_date: v.pipe(
        v.string("Date is required"),
        v.nonEmpty("Date cannot be empty"),
        v.isoDate("Please enter a valid date"),
        v.check((date) => {
            const selectedDate = new Date(date);
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            return selectedDate <= today;
        }, "Date cannot be in the future")
    )
});

export { WeightEntrySchema }