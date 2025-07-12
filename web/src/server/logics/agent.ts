'use server';

import {
    AgentSpec,
    AgentStreamApiResp,
    CreateAgentForm,
    FunctionSpec,
    ResourceData,
    ResourceID,
    ResourceList,
    Tool
} from '@/common/types';
import { client } from '../infra/k8s';
import { ResourceKind } from '../common/enum';
import { buildSink, buildSources } from './common';
import { buildErrorResponse, buildSuccessResponse } from '../common/utils';

const version = 'v1alpha1';
const group = 'as.agentstream.github.io';
const plural = 'agents';
const namespace = 'default';

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

export async function createAgent(form: CreateAgentForm): Promise<AgentStreamApiResp> {
    const { name, description, model, googleApiKey, instruction, functions, sources, sink } = form;
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
            group,
            version,
            namespace,
            plural,
            body
        })) as ResourceData<AgentSpec>;
        return buildSuccessResponse(resp.metadata);
    } catch (err) {
        return buildErrorResponse(err);
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
        return buildSuccessResponse(resp.metadata);
    } catch (err) {
        return buildErrorResponse(err);
    }
}

export async function updateAgent(
    form: Record<string, string> & { functions: ResourceID[] }
): Promise<AgentStreamApiResp> {
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
    const {
        metadata: { resourceVersion }
    } = await getAgentDetails(namespace, name);
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
    try {
        const resp = (await client.replaceNamespacedCustomObject({
            name,
            group,
            version,
            namespace,
            plural,
            body
        })) as ResourceData<FunctionSpec>;
        return buildSuccessResponse(resp.metadata);
    } catch (err) {
        return buildErrorResponse(err);
    }
}

function buildTools(tools: ResourceID[]): Tool[] {
    return (tools ?? []).map(tool => {
        const [namespace, name] = tool.split('/');
        return { namespace, name };
    });
}
