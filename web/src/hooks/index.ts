import { usePathname } from "next/navigation";
import { useMemo } from "react";

export function usePath(level?: number): string {
    const pathname = usePathname();
    return useMemo(() => {
        if (!level) {
            return pathname;
        }
        const segments = pathname.split('/');
        if (level <= 0 || level > segments.length) {
            return '';
        }
        return segments.slice(0, level + 1).join('/');
    }, [pathname, level]);
}
