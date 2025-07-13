import { deleteFunction, getFunctionDetails, listAllFunctions } from '@/server/logics/function';
import { notification } from '@/common/antd';
import {
  AgentStreamApiResp,
  KubernetesApiRespBody,
  PackageSpec,
  ResourceData,
  ResourceInfo,
  ResourceList,
  SpecMap,
  Specs
} from './types';
import { placement } from './constants';
import { deleteAgent, getAgentDetails, listAllAgents } from '@/server/logics/agent';
import { capitalize, isRequestSuccess } from './utils';
import { getPackageDetails, listAllPackages } from '@/server/logics/package';
import { Module } from './enum';

export async function deleteFunctionInteraction(name: string, namespace: string) {
  const resp = await deleteFunction(name, namespace);
  if (isRequestSuccess(resp)) {
    notification.success({
      message: 'Delete Success!',
      placement
    });
  } else {
    notification.error({
      message: 'Delete Failed!',
      description: (resp.data as KubernetesApiRespBody).message,
      placement
    });
  }
}

export async function deleteAgentInteraction(name: string, namespace: string) {
  const resp = await deleteAgent(name, namespace);
  if (isRequestSuccess(resp)) {
    notification.success({
      message: 'Delete Success!',
      placement
    });
  } else {
    notification.error({
      message: 'Delete Failed!',
      description: (resp.data as KubernetesApiRespBody).message,
      placement
    });
  }
}

export function flattenFunctionConfig(config: [string, string][]): Record<string, string> {
  return config
    .map(([key, value]) => ({ [`config.${key}`]: value }))
    .reduce((obj1, obj2) => ({ ...obj1, ...obj2 }), {});
}

const listAll = {
  [Module.Package]: listAllPackages,
  [Module.Function]: listAllFunctions,
  [Module.Agent]: listAllAgents
};

export async function listAllWithNotice<T extends Module, U = SpecMap[T]>(module: T) {
  const resp = await listAll[module]();
  if (!isRequestSuccess(resp)) {
    const description = (resp.data as KubernetesApiRespBody)?.message ?? 'Something went wrong!';
    notification.error({
      message: 'Query Failed!',
      description,
      placement
    });
  }
  return resp as AgentStreamApiResp<ResourceList<U>>;
}

const getDetails = {
  [Module.Package]: getPackageDetails,
  [Module.Function]: getFunctionDetails,
  [Module.Agent]: getAgentDetails
};

export async function getDetailsWithNotice<T extends Module, U = SpecMap[T]>(
  module: T,
  namespace: string,
  name: string
) {
  const resp = await getDetails[module](namespace, name);
  if (!isRequestSuccess(resp)) {
    const description = (resp.data as KubernetesApiRespBody)?.message ?? 'Something went wrong!';
    notification.error({
      message: `Query ${capitalize(module)} Failed!`,
      description,
      placement
    });
  }
  return resp as AgentStreamApiResp<ResourceData<U>>;
}

export function parseResourceData<T extends Specs>(item: ResourceData<T>): ResourceInfo {
  return {
    id: `${item.metadata.namespace}/${item.metadata.name}`,
    name: item.spec.displayName || item.metadata.name,
    description: item.spec.description,
    logo: (item.spec as PackageSpec).logo ?? ''
  };
}
