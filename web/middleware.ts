import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
    // NEXT_PUBLIC_AUTH_KEY="public" is a special case that allows access without a key
    // WARNING: It allows anyone to access the API
    if (process.env.NEXT_PUBLIC_AUTH_KEY === "public" || process.env.NEXT_PUBLIC_AUTH_KEY === "dev") {
        return NextResponse.next();
    }
    if (!process.env.NEXT_PUBLIC_AUTH_KEY) {
        return new Response("Auth setting is required", {
            status: 401
        });
    }

    // get index?k=<key> and set it to cookie
    // when next time, use cookie to check
    const requestUrl = new URL(req.url);
    const kParam = requestUrl.searchParams.get("k");
    if (kParam) {
        const escapedK = encodeURIComponent(kParam);
        return NextResponse.next({
            headers: {
                "Set-Cookie": `k=${escapedK}; Path=/; HttpOnly; SameSite=Strict`
            }
        });
    }

    const k = req.cookies.get("k");
    if (!k) {
        return new Response("Auth required", {
            status: 401
        });
    }
    if (k.value === process.env.NEXT_PUBLIC_AUTH_KEY) {
        return NextResponse.next();
    }
    return new Response("Auth required", {
        status: 401
    });
}
