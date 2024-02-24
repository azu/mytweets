import { LineTweetResponse } from "./search";
import { FaSpinner } from "react-icons/fa";
import dayjs from "dayjs";
import { MdPerson, MdUpdate } from "react-icons/md";
import utc from "dayjs/plugin/utc";
import { ReactElement } from "react";

dayjs.extend(utc);
const StatusLink = (props: { itemId: string; children: ReactElement }) => {
    // at://did:plc:niluiwex7fsnjak2wxs4j47y/app.bsky.feed.post/3jzhqaznbqk2i
    // -> https://bsky.app/profile/{did}/post/{contentId}
    if (props.itemId.startsWith("at://")) {
        // @ts-expect-error
        const [_, did, contentId] = props.itemId.match(/at:\/\/(did:plc:.*?)\/app.bsky.feed.post\/(.*)/);
        return (
            <a href={`https://bsky.app/profile/${did}/post/${contentId}`} target={"_blank"}>
                {props.children}
            </a>
        );
    }
    // twitter.com/_/status/{itemId}
    return (
        <a href={`https://twitter.com/_/status/${props.itemId}`} target={"_blank"}>
            {props.children}
        </a>
    );
};

export function SearchResultContent(props: {
    isFetching: boolean;
    searchResults: LineTweetResponse[];
    screenName: string;
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
                        const isTwitter = !item.id.startsWith("at://");
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
                                    <StatusLink itemId={item.id}>
                                        <time dateTime={day.toISOString()}>{day.format("YYYY-MM-DD HH:mm")}</time>
                                    </StatusLink>
                                    {isTwitter && (
                                        <>
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
                                        </>
                                    )}
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
