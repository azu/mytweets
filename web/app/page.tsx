import React, { Suspense, use } from "react";
import { fetchS3Select, FetchS3SelectResult } from "./server/search";
import { SiTwitter } from "react-icons/si";
import { SearchResultContent, SearchResultContentStream } from "./server/SearchResult";
import { SearchBox } from "./client/SearchBox";
import { SearchMore, SearchMoreStream } from "./client/SearchMore";
import { TransitionContextProvider } from "./client/TransitionContext";
import { SearchResultContentWrapper } from "./client/SearchResultContentWrapper";

export type HomPageSearchParam = {
    q?: string;
    max?: string;
    screen_name?: string;
    timestamp?: string;
};

const HitCount = (props: { count: number }) => {
    if (Number.isNaN(props.count)) {
        return <span>Hit: ___</span>;
    }
    return <span>Hit: {props.count}</span>;
};
const HitCountStream = (props: { retPromise: Promise<FetchS3SelectResult> }) => {
    const ret = use(props.retPromise);
    return <HitCount count={ret.results.length} />;
};

async function HomePage({
    searchParams
}: {
    // https://nextjs.org/docs/app/api-reference/file-conventions/page#searchparams-optional
    searchParams: HomPageSearchParam;
}) {
    const retPromise = fetchS3Select({
        max: searchParams.max ? Number(searchParams.max) : 20,
        query: searchParams.q ?? "",
        afterTimestamp: searchParams.timestamp ? Number(searchParams.timestamp) : undefined
    });
    return (
        <TransitionContextProvider>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "16px",
                    width: "100%",
                    maxWidth: "800px",
                    margin: "auto"
                }}
            >
                <div
                    style={{
                        width: "100%",
                        display: "flex",
                        flexWrap: "wrap",
                        flexDirection: "column"
                    }}
                >
                    <div>
                        <a
                            href={"https://github.com/azu/mytweets"}
                            title={"GitHub"}
                            style={{
                                display: "inline-flex",
                                alignContent: "center",
                                alignItems: "center",
                                paddingRight: "4px"
                            }}
                        >
                            <SiTwitter />
                        </a>
                        <SearchBox query={searchParams.q} />
                    </div>
                    <div>
                        <Suspense fallback={<HitCount count={NaN} />}>
                            <HitCountStream retPromise={retPromise} />
                        </Suspense>
                    </div>
                </div>
                <SearchResultContentWrapper>
                    <Suspense
                        fallback={
                            <>
                                <div>Loading...</div>
                            </>
                        }
                    >
                        <SearchResultContentStream
                            retPromise={retPromise}
                            screenName={searchParams.screen_name ?? ""}
                        />
                    </Suspense>
                </SearchResultContentWrapper>
                <Suspense>
                    <SearchMoreStream retPromise={retPromise} />
                </Suspense>
            </div>
        </TransitionContextProvider>
    );
}

export default HomePage;
