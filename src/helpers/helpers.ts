import type { GUID } from "../defines/types";

export function generateQuickGuid() : GUID {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15) as GUID;
}
