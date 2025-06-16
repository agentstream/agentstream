'use server';

import { AgentStreamApiResp, KubernetesApiResp, ResourceData, ResourceList } from '@/common/types';
import { client } from '../infra/k8s';
import { ResourceKind } from '../common/enum';
import { StatusCodes } from 'http-status-codes';

const version = 'v1alpha1';
const group = 'fs.functionstream.github.io';
const plural = 'functions';

export async function listAllFunctions() {
    const resp = await client.listCustomObjectForAllNamespaces({
        group,
        version,
        plural
    });
    return resp as ResourceList;
}

export async function getFunctionDetails(namespace: string, name: string) {
    const resp = await client.getNamespacedCustomObject({
        group,
        version,
        namespace,
        plural,
        name
    });
    return resp as ResourceData;
}

const configItemPrefix = 'config.';

export async function createFunction(form: Record<string, string>): Promise<AgentStreamApiResp> {
    const { name, description, package: pak, module, sources, sink } = form;
    const namespace = pak.split('/')[0];
    const config = Object.entries(form)
        .filter(([key]) => key.startsWith(configItemPrefix))
        .map(([key, value]) => ({ [key.slice(configItemPrefix.length)]: value }))
        .reduce((obj1, obj2) => ({ ...obj1, ...obj2 }), {});
    const body = {
        apiVersion: `${group}/${version}`,
        kind: ResourceKind.Function,
        metadata: {
            name,
            namespace
        },
        spec: {
            description: description ?? '',
            displayName: name,
            module,
            package: pak,
            sources: (sources ?? '')
                .split(',')
                .filter(item => item !== '')
                .map(topic => ({
                    pulsar: {
                        topic,
                        subscriptionName: ''
                    }
                })),
            sink: {
                pulsar: {
                    topic: sink ?? ''
                }
            },
            config
        }
    };
    try {
        const resp = await client.createNamespacedCustomObject({
            group,
            version,
            namespace: form['package'].split('/')[0],
            plural,
            body
        });
        return {
            code: StatusCodes.CREATED,
            data: {
                bid: `${namespace}/${name}`,
                uid: (resp as ResourceData).metadata.uid
            }
        };
    } catch (err) {
        const { code, body } = err as KubernetesApiResp;
        return {
            code,
            data: JSON.parse(body)
        };
    }
}
