"use client";
import { FetchS3SelectResult, LineTweetResponse } from "../server/search";
import { use, useMemo, useTransition } from "react";
import { useTypeUrlSearchParams } from "../lib/useTypeUrlSearchParams";
import { HomPageSearchParam } from "../page";

export const useSearchMore = (props: { searchResults: LineTweetResponse[] }) => {
    const searchParams = useTypeUrlSearchParams<HomPageSearchParam>();
    const [isLoadingMore, startTransition] = useTransition();
    const handlers = useMemo(() => {
        return {
            handleMoreTweets: () => {
                const lastItemTimeStamp = props.searchResults[props.searchResults.length - 1].timestamp;
                if (!lastItemTimeStamp) {
                    return;
                }
                startTransition(() => {
                    searchParams.pushParams({
                        timestamp: String(lastItemTimeStamp)
                    });
                });
            }
        };
    }, [props.searchResults]);
    return {
        handlers,
        isLoadingMore
    } as const;
};
export const SearchMore = (props: { ret: FetchS3SelectResult }) => {
    const { handlers, isLoadingMore } = useSearchMore({
        searchResults: props.ret.results
    });
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column"
            }}
        >
            <button
                onClick={handlers.handleMoreTweets}
                disabled={isLoadingMore}
                style={{
                    opacity: isLoadingMore ? 0.5 : 1
                }}
            >
                More Tweets
            </button>
        </div>
    );
};
export const SearchMoreStream = (props: { retPromise: Promise<FetchS3SelectResult> }) => {
    const ret = use(props.retPromise);
    return <SearchMore ret={ret} />;
};
