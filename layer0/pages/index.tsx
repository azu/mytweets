import { useEffect, useMemo, useState } from "react";
import { SearchResponse, LineTweetResponse } from "./api/search";
import { useDebounce } from "use-debounce";
import Head from "next/head";
import { SiTwitter } from "react-icons/si";
import { FaSpinner } from "react-icons/fa";
import dayjs from "dayjs";

const GlobalStyle = () => {
    return (
        <style jsx global>
            {`
                html,
                body {
                    width: 100%;
                    margin: 0;
                    padding: 0;
                }

                /* Basic.css  https://github.com/vladocar/Basic.css */
                * {
                    box-sizing: border-box;
                }

                :root {
                    --sans: 1em/1.6 system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu,
                        Cantarell, Droid Sans, Helvetica Neue, Fira Sans, sans-serif;
                    --mono: SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, "Courier New", monospace;
                    --c1: #0074d9;
                    --c2: #eee;
                    --c3: #fff;
                    --c4: #000;
                    --c5: #fff;
                    --m1: 8px;
                    --rc: 8px;
                }

                @media (prefers-color-scheme: dark) {
                    :root {
                        --c2: #333;
                        --c3: #1e1f20;
                        --c4: #fff;
                    }
                }

                html {
                    -ms-text-size-adjust: 100%;
                    -webkit-text-size-adjust: 100%;
                }

                /* General settings */

                body {
                    margin: 0;
                    font: var(--sans);
                    font-weight: 400;
                    font-style: normal;
                    text-rendering: optimizeLegibility;
                    -webkit-font-smoothing: antialiased;
                    background-color: var(--c3);
                    color: var(--c4);
                }

                img,
                iframe {
                    border: none;
                    max-width: 100%;
                }

                a {
                    color: var(--c1);
                    text-decoration: none;
                }

                a:hover {
                    color: var(--c1);
                    text-decoration: underline;
                }

                pre {
                    font: 1em/1.6 var(--mono);
                    background: var(--c2);
                    padding: 1em;
                    overflow: auto;
                }

                code {
                    font: 1em/1.6 var(--mono);
                }

                blockquote {
                    border-left: 5px solid var(--c2);
                    padding: 1em 1.5em;
                    margin: 0;
                }

                hr {
                    border: 0;
                    border-bottom: 1px solid var(--c4);
                }

                /* Headlines */

                h1,
                h2,
                h3,
                h4,
                h5,
                h6 {
                    margin: 0.6em 0;
                    font-weight: normal;
                }

                h1 {
                    font-size: 2.625em;
                    line-height: 1.2;
                }

                h2 {
                    font-size: 1.625em;
                    line-height: 1.2;
                }

                h3 {
                    font-size: 1.3125em;
                    line-height: 1.24;
                }

                h4 {
                    font-size: 1.1875em;
                    line-height: 1.23;
                }

                h5,
                h6 {
                    font-size: 1em;
                    font-weight: bold;
                }

                /* Table */

                table {
                    border-collapse: collapse;
                    border-spacing: 0;
                    margin: 1em 0;
                }

                th,
                td {
                    text-align: left;
                    vertical-align: top;
                    border: 1px solid;
                    padding: 0.4em;
                }

                thead,
                tfoot {
                    background: var(--c2);
                }

                /* Rounded Corners*/

                pre,
                code,
                input,
                select,
                textarea,
                button,
                img {
                    border-radius: var(--rc);
                }

                /* Forms */

                input,
                select,
                textarea {
                    font-size: 1em;
                    color: var(--c4);
                    background: var(--c2);
                    border: 0;
                    padding: 0.6em;
                }

                button,
                input[type="submit"],
                input[type="reset"],
                input[type="button"] {
                    -webkit-appearance: none;
                    font-size: 1em;
                    display: inline-block;
                    color: var(--c5);
                    background: var(--c1);
                    border: 0;
                    margin: 4px;
                    padding: 0.6em;
                    cursor: pointer;
                    text-align: center;
                }

                button:hover,
                button:focus,
                input:hover,
                textarea:hover,
                select:hover {
                    opacity: 0.8;
                }

                /* Infinite Grid */

                section {
                    display: flex;
                    flex-flow: row wrap;
                }

                [style*="--c:"],
                section > section,
                aside,
                article {
                    flex: var(--c, 1);
                    margin: var(--m1);
                }

                /* Cards */

                article {
                    background: var(--c2);
                    border-radius: var(--rc);
                    padding: 1em;
                    box-shadow: 0px 1px 0px rgba(0, 0, 0, 0.3);
                }

                [style*="--c:"]:first-child,
                section > section:first-child,
                article:first-child {
                    margin-left: 0;
                }

                [style*="--c:"]:last-child,
                section > section:last-child,
                article:last-child {
                    margin-right: 0;
                }

                .Tweet-Item:hover {
                    background-color: rgba(0, 0, 0, 0.02);
                }

                .fa-spin {
                    animation: fa-spin 2s infinite linear;
                }

                @keyframes fa-spin {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(359deg);
                    }
                }
            `}
        </style>
    );
};
const useSearch = () => {
    const [query, setQuery] = useState<string>("");
    const [isFetching, setIsFetching] = useState<boolean>(false);
    const [searchCounts, setSearchCounts] = useState<{ progress: number; total: number }>({ progress: 0, total: 0 });
    const [searchResults, setSearchResults] = useState<LineTweetResponse[]>([]);
    const [debouncedQuery] = useDebounce(query, 350);
    const sortedSearchResults = useMemo(() => {
        return searchResults.sort((a, b) => {
            return a.timestamp < b.timestamp ? 1 : -1;
        });
    }, [searchResults]);
    useEffect(() => {
        const searchParams = new URLSearchParams([["q", query]]);
        const abortController = new AbortController();
        (async function fetchMain() {
            setIsFetching(true);
            const response = await fetch("/api/search?" + searchParams.toString(), {
                signal: abortController.signal
            });
            const json: SearchResponse = await response.json();
            setSearchCounts({
                progress: json.stats.BytesProcessed,
                total: json.stats.BytesScanned
            });
            setSearchResults(json.results);
            setIsFetching(false);
        })().catch((error) => {
            console.log("Fetch Abort", error);
        });
        return () => {
            setIsFetching(false);
            // setSearchCounts({
            //     total: 0,
            //     progress: 0
            // });
            // setSearchResults([]);
            abortController.abort();
        };
    }, [debouncedQuery]);
    const handlers = useMemo(
        () => ({
            search: (query: string) => {
                setQuery(query);
            }
        }),
        []
    );
    return {
        query,
        isFetching,
        searchCounts,
        searchResults,
        sortedSearchResults,
        handlers
    };
};

function HomePage() {
    const { query, isFetching, sortedSearchResults, searchCounts, handlers } = useSearch();
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                padding: "2rem",
                width: "100%"
            }}
        >
            <Head>
                <title>mytweets</title>
            </Head>
            <GlobalStyle />
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    alignContent: "center",
                    alignItems: "center",
                    flexWrap: "wrap"
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
                            onChange={(event) => handlers.search(event.currentTarget.value)}
                            style={{
                                fontSize: "20px",
                                width: "18em",
                                margin: "0 0.5em",
                                padding: "0 0.2em"
                            }}
                        />
                    </label>
                </div>
                <div>
                    <span>
                        Hit: {sortedSearchResults.length} Count: {searchCounts.progress} / {searchCounts.total}
                    </span>
                </div>
            </div>
            {isFetching ? (
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
                    {sortedSearchResults.map((item) => {
                        const day = dayjs(item.timestamp);
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
                                        fontSize: "90%"
                                    }}
                                >
                                    <a href={`https://twitter.com/_/status/${item.id}`} target={"_blank"}>
                                        <SiTwitter size={12} />
                                        <time dateTime={day.toISOString()}>{day.format("YYYY-MM-DD HH:mm")}</time>
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
        </div>
    );
}

export default HomePage;
