"use client";
import { CSSProperties, useCallback, useState } from "react";

export function CompositionInput(props: { style?: CSSProperties; value: string; onInput: (value: string) => void }) {
    const [inputValue, setInputValue] = useState(props.value);
    const [isComposing, setIsComposing] = useState(false);
    const onInput = useCallback(
        (event) => {
            const value = event.currentTarget.value;
            setInputValue(value);
            if (!isComposing) {
                props.onInput(value);
            }
        },
        [isComposing]
    );
    const onCompositionStart = useCallback((e) => {
        setIsComposing(true);
    }, []);
    const onCompositionEnd = useCallback((event) => {
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
