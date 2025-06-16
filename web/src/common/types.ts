import { Module } from './enum';

export type ResourceData<T extends Specs> = {
    apiVersion: string;
    kind: string;
    metadata: {
        name: string;
        namespace: string;
        uid: string;
    };
    spec: {
        description: string;
        displayName: string;
    } & T;
};

export type PackageSpec = {
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

export type FunctionSpec = {
    package: string;
    module: string;
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
    config: Record<string, string>;
};

export type SpecMap = {
    [Module.Package]: PackageSpec;
    [Module.Function]: FunctionSpec;
    [Module.Agent]: FunctionSpec;
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
    body: string;
    header: object;
};

export type AgentStreamApiResp = {
    code: number;
    data: object;
};
