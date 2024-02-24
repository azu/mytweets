"use client";
import { useTransitionContext } from "./TransitionContext";

export const SearchResultContentWrapper = (props: { children: React.ReactNode }) => {
    const { isLoadingTimeline } = useTransitionContext();
    return (
        <div
            style={
                isLoadingTimeline
                    ? {
                          opacity: 0.5
                      }
                    : {}
            }
        >
            {props.children}
        </div>
    );
};
