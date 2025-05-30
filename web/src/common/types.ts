export type Resource = {
    apiVersion: string,
    kind: string,
    metadata: Metadata,
    spec: Spec
}

type Metadata = {
    name: string,
    namespace: string,
    uid: string
}

type Spec = {
    description: string,
    displayName: string,
    functionType: {
        cloud: {
            image: string
        }
    },
    logo: string,
    modules: Record<string, ModuleConfig>
}

type ModuleConfig = {
    config: ConfigItem,
    description: string,
    displayName: string,
    sinkSchema: SerializedYAML<unknown>
    sourceSchema: SerializedYAML<unknown>
}

type ConfigItem = {
    description: string,
    displayName: string,
    required: boolean,
    type: string
}

export type SerializedYAML<T> = string & { __brand: 'SerializedYAML', __originalType: T }

export type SerializedJSON<T> = string & { __serialized: T }

export type ResourceList = {
    apiVersion: string,
    items: Resource[],
    kind: string,
}
