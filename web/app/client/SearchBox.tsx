"use client";
import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { CompositionInput } from "./CompositionInput";
import { useTypeUrlSearchParams } from "../lib/useTypeUrlSearchParams";
import { HomPageSearchParam } from "../page";
import { useTransitionContext } from "./TransitionContext";

const debounce = (fn: (..._: any[]) => void, delay: number) => {
    let timeout: any;
    return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            fn(...args);
        }, delay);
    };
};
const useSearch = ({ query }: { query?: string }) => {
    const [isSearching, startTransition] = useTransition();
    const [inputQuery, setInputQuery] = useState(query ?? "");
    const deferredInputValue = useDeferredValue(inputQuery);
    const searchParams = useTypeUrlSearchParams<HomPageSearchParam>();
    const { setIsLoadingTimeline } = useTransitionContext();
    useEffect(() => {
        setIsLoadingTimeline(isSearching);
    }, [isSearching]);
    useEffect(() => {
        if (deferredInputValue === query) return;
        startTransition(() => {
            searchParams.pushParams({
                q: deferredInputValue
            });
        });
    }, [deferredInputValue]);
    const handlers = useMemo(
        () => ({
            search: debounce((query: string) => {
                setInputQuery(query);
            }, 300)
        }),
        []
    );
    return {
        inputQuery,
        isSearching,
        handlers
    };
};
export const SearchBox = (props: { query?: string }) => {
    const { inputQuery, handlers } = useSearch({ query: props.query });
    return (
        <div>
            <label>
                Search:
                <CompositionInput value={inputQuery} onInput={handlers.search} style={{ width: "100%" }} />
            </label>
        </div>
    );
};
