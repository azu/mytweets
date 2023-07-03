import { NextResponse } from "next/server";

export function middleware(req: Request) {
    const k = new URL(req.url).searchParams.get("k");
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
    if (k === process.env.NEXT_PUBLIC_AUTH_KEY) {
        return NextResponse.next();
    }
    return new Response("Auth required", {
        status: 401
    });
}
