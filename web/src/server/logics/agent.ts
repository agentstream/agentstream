'use server';

import { FunctionSpec, ResourceData, ResourceList } from '@/common/types';
import { client } from '../infra/k8s';

const version = 'v1alpha1';
const group = 'fs.functionstream.github.io';
const plural = 'agents';

export async function listAllAgents() {
    const resp = await client.listCustomObjectForAllNamespaces({
        group,
        version,
        plural
    });
    return resp as ResourceList<FunctionSpec>;
}

export async function getAgentDetails(namespace: string, name: string) {
    const resp = await client.getNamespacedCustomObject({
        group,
        version,
        namespace,
        plural,
        name
    });
    return resp as ResourceData<FunctionSpec>;
}
