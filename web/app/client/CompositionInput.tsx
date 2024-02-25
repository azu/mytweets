"use client";
import React, { CSSProperties, useCallback, useState } from "react";

export function CompositionInput(props: { style?: CSSProperties; value: string; onInput: (value: string) => void }) {
    const [inputValue, setInputValue] = useState(props.value);
    const [isComposing, setIsComposing] = useState(false);
    const onInput = useCallback(
        (event: React.FormEvent<HTMLInputElement>) => {
            const value = event.currentTarget.value;
            setInputValue(value);
            if (!isComposing) {
                props.onInput(value);
            }
        },
        [isComposing]
    );
    const onCompositionStart = useCallback(() => {
        setIsComposing(true);
    }, []);
    const onCompositionEnd = useCallback((event: React.FormEvent<HTMLInputElement>) => {
        setIsComposing(false);
        const value = event.currentTarget.value;
        setInputValue(value);
        props.onInput(value);
    }, []);
    return (
        <input
            type={"text"}
            value={inputValue}
            onInput={onInput}
            style={props.style}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
        />
    );
}
