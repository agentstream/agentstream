import 'server-only';
import { CoreV1Api, CustomObjectsApi, KubeConfig } from '@kubernetes/client-node';

const config = new KubeConfig();
config.loadFromDefault();
export const client = {
    customObjectApi: config.makeApiClient(CustomObjectsApi),
    coreV1Api: config.makeApiClient(CoreV1Api)
};
