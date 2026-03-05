"use client";

import { useRef, useState, useEffect, type KeyboardEvent, type ClipboardEvent } from "react";
import { Input } from "@/components/ui/input";

interface OTPInputProps {
    length?: number;
    onComplete: (code: string) => void;
    disabled?: boolean;
}

export default function OTPInput({
    length = 6,
    onComplete,
    disabled = false,
}: OTPInputProps) {
    const [values, setValues] = useState<string[]>(Array(length).fill(""));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newValues = [...values];
        newValues[index] = value.slice(-1);
        setValues(newValues);

        // Auto-advance to next input
        if (value && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit on last digit
        const code = newValues.join("");
        if (code.length === length && !newValues.includes("")) {
            onComplete(code);
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !values[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
        if (pasteData) {
            const newValues = [...values];
            pasteData.split("").forEach((char, i) => {
                newValues[i] = char;
            });
            setValues(newValues);
            const nextIndex = Math.min(pasteData.length, length - 1);
            inputRefs.current[nextIndex]?.focus();

            if (pasteData.length === length) {
                onComplete(pasteData);
            }
        }
    };

    return (
        <div className="flex items-center justify-center gap-2 sm:gap-3">
            {values.map((value, index) => (
                <Input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value}
                    disabled={disabled}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="h-14 w-12 text-center text-2xl font-bold sm:h-16 sm:w-14"
                    aria-label={`Digit ${index + 1}`}
                />
            ))}
        </div>
    );
}
