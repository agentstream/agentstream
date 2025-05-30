import { Module } from "./enum";

export function routePathOfModuleOverview(module: Module): string {
    return `/workbench/${module}`
}

export function routePathOfDetailPage(module: Module, id: string): string {
    return `${routePathOfModuleOverview(module)}/detail/${id}`
}
