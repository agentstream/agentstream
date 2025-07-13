import { Module, QueryCacheKey } from '@/common/enum';
import { getDetailsWithNotice, listAllWithNotice } from '@/common/interactions';
import { ResourceData, SpecMap } from '@/common/types';
import { useQuery } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';

export function useModule() {
    return usePathname().split('/')[2] as Module;
}

export function useResourceList<T extends Module, U = ResourceData<SpecMap[T]>[]>(module: T) {
    return useQuery({
        queryKey: [module, QueryCacheKey.List],
        queryFn: async () => {
            const resp = await listAllWithNotice(module);
            return (resp?.data.items ?? []) as U;
        }
    });
}

export function useResourceDetails<T extends Module>(module: T, namespace: string, name: string) {
    return useQuery({
        queryKey: [module, QueryCacheKey.Detail, namespace, name],
        queryFn: async () => {
            if (!name) {
                return null;
            }
            const resp = await getDetailsWithNotice(module, namespace, name);
            return resp?.data;
        }
    });
}
