'use server';

import { PackageSpec, ResourceData, ResourceList } from '@/common/types';
import { buildErrorResponse, buildQueryResponse } from '../common/utils';
import { PackageConfig } from '../common/config';
import { client } from '../infra/k8s';

export async function listAllPackages() {
    try {
        const resp = (await client.customObjectApi.listCustomObjectForAllNamespaces({
            ...PackageConfig
        })) as ResourceList<PackageSpec>;
        return buildQueryResponse(resp);
    } catch (err) {
        return buildErrorResponse(err);
    }
}

export async function getPackageDetails(namespace: string, name: string) {
    try {
        const resp = (await client.customObjectApi.getNamespacedCustomObject({
            ...PackageConfig,
            namespace,
            name
        })) as ResourceData<PackageSpec>;
        return buildQueryResponse(resp);
    } catch (err) {
        return buildErrorResponse(err);
    }
}
