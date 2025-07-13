import { StatusCodes } from 'http-status-codes';
import { configItemPrefix } from './constants';
import { Module } from './enum';

export type ResourceData<T extends Specs | unknown> = {
    apiVersion: string;
    kind: string;
    metadata: Metadata;
    spec: T;
};

export type Metadata = {
    name: string;
    namespace: string;
    uid: string;
    resourceVersion: string;
};

type BaseSpec = {
    description: string;
    displayName: string;
};

export type PackageSpec = BaseSpec & {
    functionType: {
        cloud: {
            image: string;
        };
    };
    logo: string;
    modules: Record<
        string,
        {
            config: Record<string, string>;
            description: string;
            displayName: string;
            sinkSchema: SerializedYAML<unknown>;
            sourceSchema: SerializedYAML<unknown>;
        }
    >;
};

export type FunctionSpec = FunctionLikeSpec & {
    package: string;
    module: string;
    config: Record<string, string>;
};

type FunctionLikeSpec = BaseSpec & {
    sources: MessageChannel[];
    sink: MessageChannel;
};

export type MessageChannel = {
    pulsar: {
        topic: string;
        subscriptionName?: string;
    };
};

export type AgentSpec = FunctionLikeSpec & {
    instruction: string;
    model: Model;
    tools: Tool[];
};

type Model = {
    googleApiKey: string;
    model: string;
};

export type Tool = {
    name: string;
    namespace: string;
};

export type SpecMap = {
    [Module.Package]: PackageSpec;
    [Module.Function]: FunctionSpec;
    [Module.Agent]: AgentSpec;
};

export type Specs = SpecMap[keyof SpecMap];

export type SerializedYAML<T> = string & { __brand: 'SerializedYAML'; __originalType: T };

export type SerializedJSON<T> = string & { __serialized: T };

export type ResourceList<T extends Specs | unknown> = {
    apiVersion: string;
    items: (T extends Specs ? ResourceData<T> : unknown)[];
    kind: string;
};

export type ResourceInfo = {
    id: ResourceID;
    name: string;
    description: string;
    logo: string;
};

export type KubernetesApiResp = {
    code: number;
    body: SerializedJSON<KubernetesApiRespBody>;
    header: object;
};

export type KubernetesApiRespBody = {
    kind: string;
    apiVersion: string;
    metadata: object;
    status: string;
    message: string;
    reason: string;
    details: {
        name: string;
        group: string;
        kind: string;
    };
    code: number;
};

export type AgentStreamApiResp<T = unknown> = {
    code: StatusCodes;
    data: T;
};

export type MutateRespData = {
    bid: ResourceID;
    uid: string;
};

type FunctionConfigs = {
    [index: `${typeof configItemPrefix}.${string}`]: string;
};

export type CreateFunctionForm = {
    name: string;
    package: ResourceID;
    module: string;
} & FunctionEditableFields;

type FunctionEditableFields = {
    description: string;
    sources: string;
    sink: string;
} & FunctionConfigs;

export type UpdateFunctionForm = {
    name: string;
    namespace: string;
} & FunctionEditableFields;

export type CreateAgentForm = {
    name: string;
    description: string;
    model: string;
    googleApiKey: string;
    instruction: string;
    functions: ResourceID[];
    sources: string;
    sink: string;
};

export type ResourceID = `${string}/${string}`;
