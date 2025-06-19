import { deleteFunction } from '@/server/logics/function';
import { notification } from 'antd';
import { StatusCodes } from 'http-status-codes';
import { KubernetesApiRespBody } from './types';
import { placement } from './constants';

export async function deleteFunctionInteraction(name: string, namespace: string) {
  const resp = await deleteFunction(name, namespace);
  if (resp.code === StatusCodes.NO_CONTENT) {
    notification.success({
      message: 'Delete Success!',
      placement
    });
  } else {
    notification.error({
      message: 'Delete failed!',
      description: (resp.data as KubernetesApiRespBody).message,
      placement
    });
  }
}
