'use server';

import { AgentSpec, AgentStreamApiResp, FunctionSpec, KubernetesApiResp, ResourceData, ResourceList } from '@/common/types';
import { client } from '../infra/k8s';
import { ResourceKind } from '../common/enum';
import { StatusCodes } from 'http-status-codes';
import { deserializeJSON } from '@/common/utils';

const version = 'v1alpha1';
const group = 'as.agentstream.github.io';
const plural = 'agents';
const namespace = 'default'

export async function listAllAgents() {
    const resp = await client.listCustomObjectForAllNamespaces({
        group,
        version,
        plural
    });
    return resp as ResourceList<AgentSpec>;
}

export async function getAgentDetails(namespace: string, name: string) {
    const resp = await client.getNamespacedCustomObject({
        group,
        version,
        namespace,
        plural,
        name
    });
    return resp as ResourceData<AgentSpec>;
}

export async function createAgent(form: Record<string, string> & { functions: string[] }): Promise<AgentStreamApiResp> {
    const { name, description, model, googleApiKey, instruction, functions, sources, sink } = form;
    const tools = (functions ?? []).map(f => {
        const [namespace, name] = f.split('/')
        return { namespace, name }
    });
    const body = {
        apiVersion: `${group}/${version}`,
        kind: ResourceKind.Agent,
        metadata: {
            name,
            namespace
        },
        spec: {
            description: description ?? '',
            displayName: name,
            instruction,
            tools,
            model: {
                googleApiKey,
                model
            },
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
        }
    }
    try {
        const resp = await client.createNamespacedCustomObject({
            group,
            version,
            namespace,
            plural,
            body
        });
        return {
            code: StatusCodes.CREATED,
            data: {
                bid: `${namespace}/${name}`,
                uid: (resp as ResourceData<AgentSpec>).metadata.uid
            }
        }
    } catch (err) {
        const { code, body } = err as KubernetesApiResp;
        return {
            code,
            data: deserializeJSON(body)
        };
    }
}

export async function deleteAgent(name: string, namespace: string): Promise<AgentStreamApiResp> {
    try {
        const resp = (await client.deleteNamespacedCustomObject({
            group,
            version,
            namespace,
            plural,
            name
        })) as ResourceData<AgentSpec>;
        return {
            code: StatusCodes.NO_CONTENT,
            data: {
                bid: `${resp.metadata.namespace}/${resp.metadata.name}`,
                uid: resp.metadata.uid
            }
        };
    } catch (err) {
        const { code, body } = err as KubernetesApiResp;
        return {
            code,
            data: deserializeJSON(body)
        }
    }
}

export async function updateAgent(form: Record<string, string> & { functions: string[] }): Promise<AgentStreamApiResp> {
    const { name, namespace, description, model, googleApiKey, instruction, functions, sources, sink } = form;
    const tools = (functions ?? []).map(f => {
        const [namespace, name] = f.split('/')
        return { namespace, name }
    });
    const {
        metadata: { resourceVersion },
    } = await getAgentDetails(namespace, name)
    const body = {
        apiVersion: `${group}/${version}`,
        kind: ResourceKind.Agent,
        metadata: {
            name,
            namespace,
            resourceVersion
        },
        spec: {
            description: description ?? '',
            displayName: name,
            instruction,
            tools,
            model: {
                googleApiKey,
                model
            },
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
        }
    }
    try {
        const resp = await client.replaceNamespacedCustomObject({
            name,
            group,
            version,
            namespace,
            plural,
            body
        })
        return {
            code: StatusCodes.OK,
            data: {
                bid: `${namespace}/${name}`,
                uid: (resp as ResourceData<FunctionSpec>).metadata.uid
            }
        }
    } catch (err) {
        const { code, body } = err as KubernetesApiResp
        return {
            code,
            data: deserializeJSON(body)
        }
    }
}