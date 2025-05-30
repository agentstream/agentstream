'use server'

import { Resource, ResourceList, SerializedYAML } from "@/common/types"
import { client } from "../infra/k8s"

const version = 'v1alpha1'
const group = 'fs.functionstream.github.io'
const plural = 'packages'

export async function listAllPackages() {
    const resp = await client.listCustomObjectForAllNamespaces({
        group,
        version,
        plural
    })
    return resp as ResourceList
}

export async function getPackageDetails(namespace: string, name: string) {
    const resp = await client.getNamespacedCustomObject({
        group,
        version,
        namespace,
        plural,
        name,
    })
    return resp as SerializedYAML<Resource>
}
