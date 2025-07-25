'use server';

import { buildErrorResponse, buildQueryResponse } from '../common/utils';
import { client } from '../infra/k8s';

export async function listAllNamespaces() {
    try {
        const resp = await client.coreV1Api.listNamespace();
        return buildQueryResponse(
            resp.items.map(item => item.metadata?.name ?? '').filter(item => item !== '')
        );
    } catch (err) {
        return buildErrorResponse(err);
    }
}
