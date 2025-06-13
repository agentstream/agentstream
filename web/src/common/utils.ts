import { Module, RoutePath } from "./enum";
import YAML from 'yaml'
import { SerializedJSON, SerializedYAML } from "./types";

export function routePathOfModuleOverview(module: Module): string {
    return `${RoutePath.WorkBench}/${module}`
}

export function routePathOfDetailPage(module: Module, id: string): string {
    return `${routePathOfModuleOverview(module)}/${id}`
}

export function serializeToJSON<T>(value: T): SerializedJSON<T> {
    return JSON.stringify(value) as SerializedJSON<T>
}

export function deserializeJSON<T>(value: SerializedJSON<T>): T {
    return JSON.parse(value)
}

export function serializeToYAML<T>(value: T): SerializedYAML<T> {
    return YAML.stringify(value) as SerializedYAML<T>
}

export function deserializeYAML<T>(value: SerializedYAML<T>): T {
    return YAML.parse(value)
}
