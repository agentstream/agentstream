import { AgentStreamApiResp, KubernetesApiResp, Metadata, MutateRespData } from '@/common/types';
import { deserializeJSON } from '@/common/utils';
import { StatusCodes } from 'http-status-codes';

export function buildErrorResponse(err: unknown): AgentStreamApiResp {
    const { code, body } = err as KubernetesApiResp;
    if (code !== undefined && body !== undefined) {
        return {
            code,
            data: deserializeJSON(body)
        };
    }
    return {
        code: StatusCodes.INTERNAL_SERVER_ERROR,
        data: {}
    };
}

export function buildMutateResponse(metadata: Metadata): AgentStreamApiResp<MutateRespData> {
    return {
        code: StatusCodes.OK,
        data: {
            bid: `${metadata.namespace}/${metadata.name}`,
            uid: metadata.uid
        }
    };
}

export function buildQueryResponse<T>(data: T): AgentStreamApiResp<T> {
    return {
        code: StatusCodes.OK,
        data
    };
}
