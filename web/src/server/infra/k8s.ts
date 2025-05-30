import { CustomObjectsApi, KubeConfig } from "@kubernetes/client-node"

const config = new KubeConfig()
config.loadFromDefault()
export const client = config.makeApiClient(CustomObjectsApi)
