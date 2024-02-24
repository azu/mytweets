import React from "react";
import { Metadata } from "next";
import "./global.css";

export const metadata: Metadata = {
    title: "mytweet",
    description: "twitter search engine for me",
    /*

                <link rel="shortcut icon" href="/favicon.ico" />
                <link rel="icon" type="image/x-icon" sizes="16x16 32x32" href="/favicon.ico" />
                <link rel="icon" sizes="192x192" href="/favicon-192.png" />
                <link rel="apple-touch-icon" sizes="180x180" href="/favicon-180-precomposed.png" />
                <meta name="msapplication-TileColor" content="#FFFFFF" />
                <meta name="msapplication-TileImage" content="/favicon-114-precomposed.png" />
     */
    icons: [
        {
            rel: "shortcut icon",
            url: "/favicon.ico"
        },
        {
            rel: "icon",
            type: "image/x-icon",
            sizes: "16x16 32x32",
            url: "/favicon.ico"
        },
        {
            rel: "icon",
            sizes: "192x192",
            url: "/favicon-192.png"
        },
        {
            rel: "apple-touch-icon",
            sizes: "180x180",
            url: "/favicon-180-precomposed.png"
        }
    ]
};
export default function RootLayout({
    // Layouts must accept a children prop.
    // This will be populated with nested layouts or pages
    children
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
