'use server';

import { PackageSpec, ResourceData, ResourceList } from '@/common/types';
import { client } from '../infra/k8s';
import { buildErrorResponse, buildQueryResponse } from '../common/utils';

const version = 'v1alpha1';
const group = 'fs.functionstream.github.io';
const plural = 'packages';

export async function listAllPackages() {
    try {
        const resp = (await client.listCustomObjectForAllNamespaces({
            group,
            version,
            plural
        })) as ResourceList<PackageSpec>;
        return buildQueryResponse(resp);
    } catch (err) {
        return buildErrorResponse(err);
    }
}

export async function getPackageDetails(namespace: string, name: string) {
    try {
        const resp = (await client.getNamespacedCustomObject({
            group,
            version,
            namespace,
            plural,
            name
        })) as ResourceData<PackageSpec>;
        return buildQueryResponse(resp);
    } catch (err) {
        return buildErrorResponse(err);
    }
}
