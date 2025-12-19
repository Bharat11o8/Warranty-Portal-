import { useRef, useEffect, KeyboardEvent, ClipboardEvent, ChangeEvent } from "react";

interface OTPInputProps {
    value: string[];
    onChange: (value: string[]) => void;
    length?: number;
}

const OTPInput = ({ value, onChange, length = 6 }: OTPInputProps) => {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Auto-focus first input on mount
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;

        // Only allow single digit
        if (!/^\d?$/.test(val)) return;

        const newValue = [...value];
        newValue[index] = val;
        onChange(newValue);

        // Auto-advance to next input
        if (val && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        // Backspace navigation
        if (e.key === "Backspace" && !value[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }

        // Arrow key navigation
        if (e.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === "ArrowRight" && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text");
        const digits = pastedData.replace(/\D/g, "").slice(0, length).split("");

        if (digits.length > 0) {
            const newValue = [...value];
            digits.forEach((digit, i) => {
                if (i < length) {
                    newValue[i] = digit;
                }
            });
            onChange(newValue);

            // Focus the next empty input or last input
            const nextEmptyIndex = newValue.findIndex(v => !v);
            const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex;
            inputRefs.current[focusIndex]?.focus();
        }
    };

    return (
        <div className="flex gap-3 justify-center">
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[index] || ""}
                    onChange={(e) => handleChange(index, e)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    aria-label={`OTP digit ${index + 1}`}
                    className="
            h-16 w-14 text-center text-2xl font-bold
            border-2 border-gray-300 bg-white rounded-xl shadow-sm
            focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 
            focus:shadow-md focus:outline-none
            transition-all
          "
                />
            ))}
        </div>
    );
};

export default OTPInput;
