import { Module, RoutePath } from './enum';
import YAML from 'yaml';
import {
    PackageSpec,
    ResourceData,
    ResourceInfo,
    SerializedJSON,
    SerializedYAML,
    Specs
} from './types';

export function routePathOfOverviewPage(module: Module): string {
    return `${RoutePath.WorkBench}/${module}`;
}

export function routePathOfDetailPage(module: Module, id: string): string {
    return `${routePathOfOverviewPage(module)}/${id}`;
}

export function routePathOfCreatePage(module: Module): string {
    return `${routePathOfOverviewPage(module)}/create`;
}

export function serializeToJSON<T>(value: T): SerializedJSON<T> {
    return JSON.stringify(value) as SerializedJSON<T>;
}

export function deserializeJSON<T>(value: SerializedJSON<T>): T {
    return JSON.parse(value);
}

export function serializeToYAML<T>(value: T): SerializedYAML<T> {
    return YAML.stringify(value) as SerializedYAML<T>;
}

export function deserializeYAML<T>(value: SerializedYAML<T>): T {
    return YAML.parse(value);
}

export function parseResourceData<T extends Specs>(item: ResourceData<T>): ResourceInfo {
    return {
        id: `${item.metadata.namespace}/${item.metadata.name}`,
        name: item.spec.displayName || item.metadata.name,
        description: item.spec.description,
        logo: (item.spec as PackageSpec).logo ?? ''
    };
}

export function codeBlockInMarkdown(language: string, content: string): string {
    return content ? '```' + language + '\n' + content.trim() + '\n```' : '';
}
