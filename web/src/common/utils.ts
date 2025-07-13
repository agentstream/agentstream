import { Module, RoutePath } from './enum';
import YAML from 'yaml';
import { AgentStreamApiResp, SerializedJSON, SerializedYAML } from './types';
import { StatusCodes } from 'http-status-codes';
import { placement } from './constants';
import { notification } from '@/common/antd';

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

export function codeBlockInMarkdown(language: string, content: string): string {
    return content ? '```' + language + '\n' + content.trim() + '\n```' : '';
}

export function mergeObjects<T>(objs: Record<string, T>[]): Record<string, T> {
    return objs.reduce((obj1, obj2) => ({ ...obj1, ...obj2 }), {});
}

export function isRequestSuccess(resp: AgentStreamApiResp): boolean {
    return resp.code === StatusCodes.OK;
}

export function noticeUnhandledError(isError: boolean, error: Error | null) {
    if (isError) {
        notification.error({
            message: 'Unknown Error!',
            description: error!.message,
            placement
        });
    }
}

export function capitalize(str: string): string {
    return str.length < 1 ? str : str[0] + str.slice(1);
}

export function isCreationEnabled(module: Module): boolean {
    return [Module.Function, Module.Agent].includes(module);
}
