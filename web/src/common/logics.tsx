import { configItemPrefix } from './constants';
import { PackageSpec, ResourceData, ResourceInfo, Specs } from './types';

export function flattenFunctionConfig(config: [string, string][]): Record<string, string> {
  return config
    .map(([key, value]) => ({ [`${configItemPrefix}.${key}`]: value }))
    .reduce((obj1, obj2) => ({ ...obj1, ...obj2 }), {});
}

export function parseResourceData<T extends Specs>(item: ResourceData<T>): ResourceInfo {
  return {
    id: `${item.metadata.namespace}/${item.metadata.name}`,
    name: item.spec.displayName || item.metadata.name,
    description: item.spec.description,
    logo: (item.spec as PackageSpec).logo ?? ''
  };
}
