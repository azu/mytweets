import { useEffect, useMemo, useState } from "react";
import { SearchResponse, LineTweetResponse, fetchS3Select } from "./api/search";
import { useDebounce } from "use-debounce";
import Head from "next/head";
import { SiTwitter } from "react-icons/si";
import { FaSpinner } from "react-icons/fa";
import { MdUpdate, MdPerson } from "react-icons/md";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { GlobalStyle } from "../components/GlobalStyle";
dayjs.extend(utc);

const DEFAULT_MAX = 30;
type ResponseStat = { BytesProcessed: number; BytesScanned: number };
const useSearch = ({
    initialQuery,
    screen_name,
    initialSearchResults,
    initialStats
}: {
    initialQuery?: string;
    screen_name?: string;
    initialSearchResults?: LineTweetResponse[];
    initialStats?: ResponseStat;
}) => {
    const [screenName, setScreenName] = useState<string>(screen_name ?? "");
    const [query, setQuery] = useState<string>(initialQuery ?? "");
    const [max, setMax] = useState<number>(DEFAULT_MAX);
    // Paging timestamp
    const [afterTimestamp, setAfterTimestamp] = useState<null | number>(null);
    const [isFetching, setIsFetching] = useState<boolean>(!initialSearchResults);
    const [searchCounts, setSearchCounts] = useState<ResponseStat>(
        initialStats ?? {
            BytesProcessed: 0,
            BytesScanned: 0
        }
    );
    const [searchResults, setSearchResults] = useState<LineTweetResponse[]>(initialSearchResults ?? []);
    const [debouncedQuery] = useDebounce(query, 350);
    const sortedSearchResults = useMemo(() => {
        return searchResults.sort((a, b) => {
            return a.timestamp < b.timestamp ? 1 : -1;
        });
    }, [searchResults]);
    const moreTweets = useMemo(() => {
        return searchResults.length === DEFAULT_MAX;
    }, [searchResults]);

    useEffect(() => {
        if (searchResults.length !== 0) {
            return;
        }
        const searchParams = new URLSearchParams(
            [["q", debouncedQuery]].concat(afterTimestamp ? [["afterTimestamp", String(afterTimestamp)]] : [])
        );
        const abortController = new AbortController();
        (async function fetchMain() {
            setIsFetching(true);
            const response = await fetch("/api/search?" + searchParams.toString(), {
                signal: abortController.signal
            });
            const json: SearchResponse = await response.json();
            setSearchCounts({
                BytesProcessed: json.stats.BytesProcessed,
                BytesScanned: json.stats.BytesScanned
            });
            setSearchResults(json.results);
            setIsFetching(false);
        })().catch((error) => {
            console.log("Fetch Abort", error);
        });
        return () => {
            setIsFetching(false);
            abortController.abort();
        };
    }, [debouncedQuery, max, afterTimestamp]);
    const handlers = useMemo(
        () => ({
            search: (query: string) => {
                setSearchResults([]);
                setAfterTimestamp(null);
                setQuery(query);
            },
            moreTweets: () => {
                const lastResult = searchResults[searchResults.length - 1];
                if (lastResult) {
                    setSearchResults([]);
                    setAfterTimestamp(lastResult.timestamp);
                }
            }
        }),
        [searchResults]
    );
    return {
        screenName,
        query,
        moreTweets,
        isFetching,
        searchCounts,
        searchResults,
        sortedSearchResults,
        handlers
    };
};

export async function getServerSideProps(context) {
    const { q, screen_name } = context.query;
    if (!q) {
        return {
            props: {}
        };
    }
    const { responses, stats } = await fetchS3Select({ query: q, max: DEFAULT_MAX });
    return {
        props: {
            q: q,
            screen_name: screen_name ?? "",
            searchResults: responses,
            stats
        }
    };
}

function HomePage({
    q,
    screen_name,
    searchResults,
    stats
}: {
    q: string;
    screen_name: string;
    searchResults?: LineTweetResponse[];
    stats?: ResponseStat;
}) {
    const { query, screenName, moreTweets, isFetching, sortedSearchResults, searchCounts, handlers } = useSearch({
        initialQuery: q,
        screen_name: screen_name,
        initialSearchResults: searchResults,
        initialStats: stats
    });
    return (
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
            <Head>
                <title>mytweets</title>
                <base target="_blank" />
                <link rel="shortcut icon" href="/favicon.ico" />
                <link rel="icon" type="image/x-icon" sizes="16x16 32x32" href="/favicon.ico" />
                <link rel="icon" sizes="192x192" href="/favicon-192.png" />
                <link rel="apple-touch-icon" sizes="180x180" href="/favicon-180-precomposed.png" />
                <meta name="msapplication-TileColor" content="#FFFFFF" />
                <meta name="msapplication-TileImage" content="/favicon-114-precomposed.png" />
            </Head>
            <GlobalStyle />
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
                    <label>
                        Search:
                        <input
                            type={"text"}
                            value={query}
                            onInput={(event) => handlers.search(event.currentTarget.value)}
                            style={{ width: "100%" }}
                        />
                    </label>
                </div>
                <div>
                    <span>
                        Hit: {sortedSearchResults.length} Count: {searchCounts.BytesProcessed} /{" "}
                        {searchCounts.BytesScanned}
                    </span>
                </div>
            </div>
            <SearchResultContent
                isFetching={isFetching}
                searchResults={sortedSearchResults}
                screenName={screenName}
                moreTweets={moreTweets}
                handleMoreTweets={handlers.moreTweets}
            />
        </div>
    );
}

function SearchResultContent(props: {
    isFetching: boolean;
    searchResults: LineTweetResponse[];
    screenName: string;
    moreTweets: boolean;
    handleMoreTweets: () => void;
}) {
    return (
        <div>
            {props.isFetching ? (
                <FaSpinner
                    size={24}
                    className={"fa-spin"}
                    style={{
                        margin: "8px 0"
                    }}
                />
            ) : (
                <ul
                    style={{
                        listStyle: "none",
                        padding: 0
                    }}
                >
                    {props.searchResults.map((item) => {
                        const day = dayjs.utc(item.timestamp);
                        return (
                            <li
                                key={item.id}
                                className={"Tweet-Item"}
                                style={{
                                    paddingBottom: "1rem",
                                    display: "flex",
                                    flexDirection: "column",
                                    border: "1px solid rgb(235, 238, 240)",
                                    boxSizing: "border-box"
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: "16px",
                                        display: "flex",
                                        alignContent: "center",
                                        alignItems: "center"
                                    }}
                                >
                                    <a href={`https://twitter.com/_/status/${item.id}`} target={"_blank"}>
                                        <time dateTime={day.toISOString()}>{day.format("YYYY-MM-DD HH:mm")}</time>
                                    </a>
                                    <a
                                        href={`https://twitter.com/search?q=${encodeURIComponent(
                                            "filter:follows since:" +
                                                day.format("YYYY-MM-DD_HH:mm:ss_UTC") +
                                                " until:" +
                                                day.add(1, "day").format("YYYY-MM-DD_HH:mm:ss_UTC") +
                                                ""
                                        )}&src=typed_query&f=live`}
                                        title={"Search this date"}
                                        target={"_blank"}
                                        className="Icon-Center"
                                    >
                                        <MdUpdate size={16} style={{}} />
                                    </a>

                                    <a
                                        href={`https://twitter.com/search?q=${encodeURIComponent(
                                            "from:" +
                                                props.screenName +
                                                " since:" +
                                                day.format("YYYY-MM-DD_HH:mm:ss_UTC") +
                                                " until:" +
                                                day.add(1, "day").format("YYYY-MM-DD_HH:mm:ss_UTC") +
                                                ""
                                        )}&src=typed_query&f=live`}
                                        title={"Search this date from me"}
                                        target={"_blank"}
                                        className="Icon-Center"
                                    >
                                        <MdPerson size={16} />
                                    </a>
                                </span>
                                <p
                                    style={{
                                        margin: 0,
                                        padding: "0 12px",
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-word"
                                    }}
                                    dangerouslySetInnerHTML={{
                                        __html: item.html
                                    }}
                                />
                            </li>
                        );
                    })}
                </ul>
            )}
            {props.moreTweets ? (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column"
                    }}
                >
                    <button onClick={props.handleMoreTweets}>More Tweets</button>
                </div>
            ) : null}
        </div>
    );
}

export default HomePage;
