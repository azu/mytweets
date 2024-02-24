"use client";
// https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/1202
import type { ReadonlyURLSearchParams } from "next/navigation";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";

type TypedURLSearchParams<T extends Record<string, unknown>> = Omit<
    ReadonlyURLSearchParams,
    "append" | "delete" | "forEach" | "get" | "getAll" | "has" | "set"
> & {
    append: <K extends keyof T>(name: K, value: T[K]) => void;
    delete: <K extends keyof T>(name: K, value?: T[K]) => void;
    forEach: (
        callbackfn: (value: string, key: keyof T, parent: TypedURLSearchParams<T>) => void,
        thisArg?: unknown
    ) => void;
    get: <K extends keyof T>(name: K) => T[K] | null;
    getAll: <K extends keyof T>(name: K) => T[K][];
    has: <K extends keyof T>(name: K, value?: T[K]) => boolean;
    set: <K extends keyof T>(name: K, value: T[K]) => void;
};

function useTypeUrlSearchParams<T>() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams() as unknown as TypedURLSearchParams<Partial<T>>;
    const urlSearchParams = new URLSearchParams(searchParams.toString());

    function pushParams(params: Partial<T>) {
        Object.entries(params).forEach(([key, value]) => {
            if (value === undefined || value === null) {
                urlSearchParams.delete(key);
            } else {
                urlSearchParams.set(key, String(value));
            }
        });

        const search = urlSearchParams.toString();
        const query = search ? `?${search}` : "";
        router.push(`${pathname}${query}` as Route);
    }

    return { queryParams: searchParams, pushParams };
}

export { useTypeUrlSearchParams };
