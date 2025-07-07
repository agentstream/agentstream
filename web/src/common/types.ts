import { Module } from './enum';

export type ResourceData<T extends Specs> = {
    apiVersion: string;
    kind: string;
    metadata: {
        name: string;
        namespace: string;
        uid: string;
        resourceVersion: string;
    };
    spec: T;
};

type BaseSpec = {
    description: string,
    displayName: string
}

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
    sources: {
        pulsar: {
            topic: string;
            subscriptionName: string;
        };
    }[];
    sink: {
        pulsar: {
            topic: string;
        };
    };
}

export type AgentSpec = FunctionLikeSpec & {
    instruction: string,
    model: Model,
    tools: Tool[]
};

type Model = {
    googleApiKey: string,
    model: string
}

type Tool = {
    name: string,
    namespace: string
}

export type SpecMap = {
    [Module.Package]: PackageSpec;
    [Module.Function]: FunctionSpec;
    [Module.Agent]: AgentSpec;
};

export type Specs = SpecMap[keyof SpecMap];

export type SerializedYAML<T> = string & { __brand: 'SerializedYAML'; __originalType: T };

export type SerializedJSON<T> = string & { __serialized: T };

export type ResourceList<T extends Specs> = {
    apiVersion: string;
    items: ResourceData<T>[];
    kind: string;
};

export type ResourceInfo = {
    id: string;
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

export type AgentStreamApiResp = {
    code: number;
    data: object;
};
