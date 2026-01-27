import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { autoFormatDuration, validateDuration, correctDuration } from '@/pages/workouts/utils/duration-helpers';
import { cn } from '@/lib/utils';

/**
 * Duration Input Component
 * Accepts duration in MM:SS format (e.g., "02:30")
 * 
 * @param {string} value - Current duration value
 * @param {function} onChange - Callback when duration changes
 * @param {boolean} disabled - Whether input is disabled
 * @param {string} placeholder - Input placeholder
 * @param {string} className - Additional CSS classes
 */
export function DurationInput({
    value,
    onChange,
    disabled = false,
    placeholder = "00:00",
    className = "",
    ...props
}) {
    const [localValue, setLocalValue] = useState(value || '');
    const [error, setError] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Sync with external value changes
    useEffect(() => {
        setLocalValue(value || '');
    }, [value]);

    const handleChange = (e) => {
        const input = e.target.value;

        // Auto-format as user types
        const formatted = autoFormatDuration(input);
        setLocalValue(formatted);

        // Clear error while typing
        if (error) {
            setError('');
        }
    };

    const handleBlur = () => {
        setIsFocused(false);

        // If empty, that's okay (null value)
        if (!localValue || localValue === '') {
            onChange(null);
            setError('');
            return;
        }

        // Auto-correct and validate
        const corrected = correctDuration(localValue);
        if (validateDuration(corrected)) {
            setLocalValue(corrected);
            onChange(corrected);
            setError('');
        } else {
            // If still invalid, just pass through what user entered
            onChange(localValue);
            setError('');
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
        setError('');
    };

    const handleKeyDown = (e) => {
        // Allow: backspace, delete, tab, escape, enter
        if ([8, 9, 27, 13, 46].includes(e.keyCode)) {
            return;
        }

        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        if (e.keyCode === 65 || e.keyCode === 67 || e.keyCode === 86 || e.keyCode === 88) {
            if (e.ctrlKey || e.metaKey) {
                return;
            }
        }

        // Allow: home, end, left, right
        if (e.keyCode >= 35 && e.keyCode <= 39) {
            return;
        }

        // Ensure that it is a number or colon
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) &&
            (e.keyCode < 96 || e.keyCode > 105) &&
            e.keyCode !== 186) { // 186 is colon
            e.preventDefault();
        }
    };

    return (
        <>
            <Input
                type="text"
                value={localValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                placeholder={placeholder}
                maxLength={5}
                className={cn(
                    "text-center size-5",
                    // error && "border-red-500 focus-visible:ring-red-500",
                    className
                )}
                {...props}
            />
        </>
    );
}