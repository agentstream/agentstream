'use server';

import {
    AgentSpec,
    AgentStreamApiResp,
    CreateAgentForm,
    ResourceData,
    ResourceID,
    ResourceList,
    KubernetesCustomResource,
    UpdateAgentForm
} from '@/common/types';
import { client } from '../infra/k8s';
import { ResourceKind } from '../common/enum';
import { buildSink, buildSources } from './common';
import { buildErrorResponse, buildMutateResponse, buildQueryResponse } from '../common/utils';
import { AgentConfig } from '../common/config';

const namespace = 'default';

export async function listAllAgents() {
    try {
        const resp = (await client.listCustomObjectForAllNamespaces({
            ...AgentConfig
        })) as ResourceList<AgentSpec>;
        return buildQueryResponse(resp);
    } catch (err) {
        return buildErrorResponse(err);
    }
}

export async function getAgentDetails(namespace: string, name: string) {
    try {
        const resp = (await client.getNamespacedCustomObject({
            ...AgentConfig,
            namespace,
            name
        })) as ResourceData<AgentSpec>;
        return buildQueryResponse(resp);
    } catch (err) {
        return buildErrorResponse(err);
    }
}

export async function createAgent(form: CreateAgentForm) {
    const { name, description, model, googleApiKey, instruction, functions, sources, sink } = form;
    const { group, version } = AgentConfig;
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
            tools: buildTools(functions),
            model: {
                googleApiKey,
                model
            },
            sources: buildSources(sources),
            sink: buildSink(sink)
        }
    };
    try {
        const resp = (await client.createNamespacedCustomObject({
            ...AgentConfig,
            namespace,
            body
        })) as ResourceData<AgentSpec>;
        return buildMutateResponse(resp.metadata);
    } catch (err) {
        return buildErrorResponse(err);
    }
}

export async function deleteAgent(name: string, namespace: string): Promise<AgentStreamApiResp> {
    try {
        const resp = (await client.deleteNamespacedCustomObject({
            ...AgentConfig,
            namespace,
            name
        })) as ResourceData<AgentSpec>;
        return buildMutateResponse(resp.metadata);
    } catch (err) {
        return buildErrorResponse(err);
    }
}

export async function updateAgent(form: UpdateAgentForm): Promise<AgentStreamApiResp> {
    const {
        name,
        namespace,
        description,
        model,
        googleApiKey,
        instruction,
        functions,
        sources,
        sink
    } = form;
    try {
        const {
            metadata: { resourceVersion }
        } = (await client.getNamespacedCustomObject({
            ...AgentConfig,
            namespace,
            name
        })) as ResourceData<AgentSpec>;
        const { group, version } = AgentConfig;
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
                tools: buildTools(functions),
                model: {
                    googleApiKey,
                    model
                },
                sources: buildSources(sources),
                sink: buildSink(sink)
            }
        };
        const resp = (await client.replaceNamespacedCustomObject({
            ...AgentConfig,
            name,
            namespace,
            body
        })) as ResourceData<AgentSpec>;
        return buildMutateResponse(resp.metadata);
    } catch (err) {
        return buildErrorResponse(err);
    }
}

function buildTools(tools: ResourceID[]): KubernetesCustomResource[] {
    return (tools ?? []).map(tool => {
        const [namespace, name] = tool.split('/');
        return { namespace, name };
    });
}
