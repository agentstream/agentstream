import { Module, QueryCacheKey } from '@/common/enum';
import {
    createWithNotice,
    deleteWithNotice,
    getDetailsWithNotice,
    listAllWithNotice,
    updateWithNotice
} from '@/common/interactions';
import {
    ChangableModule,
    CreateForm,
    ResourceData,
    SpecMap,
    Tool,
    UpdateForm
} from '@/common/types';
import { canChange, noticeUnhandledError } from '@/common/utils';
import { useMutation, useQuery } from '@tanstack/react-query';
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

export function useCreateResource(module: ChangableModule, callback?: () => void) {
    return useMutation({
        mutationFn: (form: CreateForm) => createWithNotice(module, form),
        onSuccess: (requestSuccess: boolean) => {
            if (requestSuccess && callback) {
                callback();
            }
        },
        onError: (error: Error) => noticeUnhandledError(true, error)
    });
}

export function useDeleteResource(module: Module, callback?: () => void) {
    return useMutation({
        mutationFn: (r: Tool) => {
            if (!canChange(module)) {
                return new Promise<false>(() => false);
            }
            const { name, namespace } = r;
            return deleteWithNotice(module, name, namespace);
        },
        onSuccess: (requestSuccess: boolean) => {
            if (requestSuccess && callback) {
                callback();
            }
        },
        onError: (error: Error) => noticeUnhandledError(true, error)
    });
}

export function useUpdateResource(module: ChangableModule, callback?: () => void) {
    return useMutation({
        mutationFn: (form: UpdateForm) => updateWithNotice(module, form),
        onSuccess: (requestSuccess: boolean) => {
            if (requestSuccess && callback) {
                callback();
            }
        },
        onError: (error: Error) => noticeUnhandledError(true, error)
    });
}
