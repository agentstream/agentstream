'use server';

import { PackageSpec, ResourceData, ResourceList } from '@/common/types';
import { client } from '../infra/k8s';
import { buildErrorResponse, buildQueryResponse } from '../common/utils';
import { PackageConfig } from '../common/config';

export async function listAllPackages() {
    try {
        const resp = (await client.listCustomObjectForAllNamespaces({
            ...PackageConfig
        })) as ResourceList<PackageSpec>;
        return buildQueryResponse(resp);
    } catch (err) {
        return buildErrorResponse(err);
    }
}

export async function getPackageDetails(namespace: string, name: string) {
    try {
        const resp = (await client.getNamespacedCustomObject({
            ...PackageConfig,
            namespace,
            name
        })) as ResourceData<PackageSpec>;
        return buildQueryResponse(resp);
    } catch (err) {
        return buildErrorResponse(err);
    }
}
