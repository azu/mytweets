"use client";
import { createContext, ReactNode, useContext, useState } from "react";

export type TransitionContext = {
    isLoadingTimeline: boolean;
    setIsLoadingTimeline: (isLoading: boolean) => void;
};
const TransitionContext = createContext<TransitionContext>({
    isLoadingTimeline: false,
    setIsLoadingTimeline: () => {}
});
export const TransitionContextProvider = (props: { children: ReactNode }) => {
    const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
    return (
        <TransitionContext.Provider value={{ isLoadingTimeline, setIsLoadingTimeline }}>
            {props.children}
        </TransitionContext.Provider>
    );
};
export const useTransitionContext = () => {
    const context = useContext(TransitionContext);
    if (!context) {
        throw new Error("useTransitionContext must be used within a TransitionContextProvider");
    }
    return context;
};
