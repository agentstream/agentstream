import { deleteFunction } from '@/server/logics/function';
import { notification } from 'antd';
import { KubernetesApiRespBody } from './types';
import { placement } from './constants';
import { deleteAgent } from '@/server/logics/agent';
import { isRequestSuccess } from './utils';

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
