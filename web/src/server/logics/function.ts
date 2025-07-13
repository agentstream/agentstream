'use server';

import {
    AgentSpec,
    CreateFunctionForm,
    FunctionSpec,
    ResourceData,
    ResourceList,
    UpdateFunctionForm
} from '@/common/types';
import { client } from '../infra/k8s';
import { ResourceKind } from '../common/enum';
import { isRequestSuccess, mergeObjects, serializeToJSON } from '@/common/utils';
import { configItemPrefix } from '@/common/constants';
import { buildErrorResponse, buildMutateResponse, buildQueryResponse } from '../common/utils';
import { buildSink, buildSources } from './common';
import { AgentConfig, FunctionConfig } from '../common/config';
import { StatusCodes } from 'http-status-codes';

export async function listAllFunctions() {
    try {
        const resp = (await client.listCustomObjectForAllNamespaces({
            ...FunctionConfig
        })) as ResourceList<FunctionSpec>;
        return buildQueryResponse(resp);
    } catch (err) {
        return buildErrorResponse(err);
    }
}

export async function getFunctionDetails(namespace: string, name: string) {
    try {
        const resp = (await client.getNamespacedCustomObject({
            ...FunctionConfig,
            namespace,
            name
        })) as ResourceData<FunctionSpec>;
        return buildQueryResponse(resp);
    } catch (err) {
        return buildErrorResponse(err);
    }
}

export async function createFunction(form: CreateFunctionForm) {
    const { name, description, package: pak, module, sources, sink } = form;
    const [namespace, packageName] = pak.split('/');
    const { group, version } = FunctionConfig;
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
            package: packageName,
            sources: buildSources(sources),
            sink: buildSink(sink),
            config: extractConfigs(form)
        }
    };
    try {
        const resp = (await client.createNamespacedCustomObject({
            ...FunctionConfig,
            namespace,
            body
        })) as ResourceData<FunctionSpec>;
        return buildMutateResponse(resp.metadata);
    } catch (err) {
        return buildErrorResponse(err);
    }
}

async function isFunctionUsed(name: string, namespace: string) {
    const resp = (await client.listCustomObjectForAllNamespaces({
        ...AgentConfig
    })) as ResourceList<AgentSpec>;
    return resp.items.some(item =>
        item.spec.tools.some(tool => tool.namespace === namespace && tool.name === name)
    );
}

export async function deleteFunction(name: string, namespace: string) {
    try {
        if (await isFunctionUsed(name, namespace)) {
            return buildErrorResponse({
                code: StatusCodes.BAD_REQUEST,
                body: serializeToJSON({
                    message: 'The function is used by agent!'
                })
            });
        }
        const resp = (await client.deleteNamespacedCustomObject({
            ...FunctionConfig,
            namespace,
            name
        })) as ResourceData<FunctionSpec>;
        return buildMutateResponse(resp.metadata);
    } catch (err) {
        return buildErrorResponse(err);
    }
}

export async function updateFunction(form: UpdateFunctionForm) {
    const { name, namespace, description, sources, sink } = form;
    const query = await getFunctionDetails(namespace, name);
    if (!isRequestSuccess(query)) {
        return query;
    }
    const {
        metadata: { resourceVersion },
        spec: { package: pak, module }
    } = query.data as ResourceData<FunctionSpec>;
    const { group, version } = FunctionConfig;
    const body = {
        apiVersion: `${group}/${version}`,
        kind: ResourceKind.Function,
        metadata: {
            name,
            namespace,
            resourceVersion
        },
        spec: {
            description: description ?? '',
            displayName: name,
            module,
            package: pak,
            sources: buildSources(sources),
            sink: buildSink(sink),
            config: extractConfigs(form)
        }
    };
    try {
        const resp = (await client.replaceNamespacedCustomObject({
            ...FunctionConfig,
            name,
            namespace,
            body
        })) as ResourceData<FunctionSpec>;
        return buildMutateResponse(resp.metadata);
    } catch (err) {
        return buildErrorResponse(err);
    }
}

function extractConfigs(form: CreateFunctionForm | UpdateFunctionForm): Record<string, string> {
    return mergeObjects(
        Object.entries(form)
            .filter(([key]) => key.startsWith(configItemPrefix))
            .map(([key, value]) => ({ [key.slice(configItemPrefix.length)]: value }))
    );
}
