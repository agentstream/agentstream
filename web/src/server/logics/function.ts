'use server';

import {
    AgentStreamApiResp,
    CreateFunctionForm,
    FunctionSpec,
    ResourceData,
    ResourceList,
    UpdateFunctionForm
} from '@/common/types';
import { client } from '../infra/k8s';
import { ResourceKind } from '../common/enum';
import { mergeObjects } from '@/common/utils';
import { configItemPrefix } from '@/common/constants';
import { buildErrorResponse, buildSuccessResponse } from '../common/utils';
import { buildSink, buildSources } from './common';

const version = 'v1alpha1';
const group = 'fs.functionstream.github.io';
const plural = 'functions';

export async function listAllFunctions() {
    const resp = await client.listCustomObjectForAllNamespaces({
        group,
        version,
        plural
    });
    return resp as ResourceList<FunctionSpec>;
}

export async function getFunctionDetails(namespace: string, name: string) {
    const resp = await client.getNamespacedCustomObject({
        group,
        version,
        namespace,
        plural,
        name
    });
    return resp as ResourceData<FunctionSpec>;
}

export async function createFunction(form: CreateFunctionForm): Promise<AgentStreamApiResp> {
    const { name, description, package: pak, module, sources, sink } = form;
    const [namespace, packageName] = pak.split('/');
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

export async function deleteFunction(name: string, namespace: string): Promise<AgentStreamApiResp> {
    try {
        const resp = (await client.deleteNamespacedCustomObject({
            group,
            version,
            namespace,
            plural,
            name
        })) as ResourceData<FunctionSpec>;
        return buildSuccessResponse(resp.metadata);
    } catch (err) {
        return buildErrorResponse(err);
    }
}

export async function updateFunction(form: UpdateFunctionForm): Promise<AgentStreamApiResp> {
    const { name, namespace, description, sources, sink } = form;
    const {
        metadata: { resourceVersion },
        spec: { package: pak, module }
    } = await getFunctionDetails(namespace, name);
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

function extractConfigs(form: CreateFunctionForm | UpdateFunctionForm): Record<string, string> {
    return mergeObjects(
        Object.entries(form)
            .filter(([key]) => key.startsWith(configItemPrefix))
            .map(([key, value]) => ({ [key.slice(configItemPrefix.length)]: value }))
    );
}
