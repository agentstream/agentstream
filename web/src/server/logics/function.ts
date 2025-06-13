'use server'

import { Resource, ResourceList } from "@/common/types"
import { client } from "../infra/k8s"

const version = 'v1alpha1'
const group = 'fs.functionstream.github.io'
const plural = 'functions'

export async function listAllFunctions() {
    const resp = await client.listCustomObjectForAllNamespaces({
        group,
        version,
        plural
    })
    return resp as ResourceList
}

export async function getFunctionDetails(namespace: string, name: string) {
    const resp = await client.getNamespacedCustomObject({
        group,
        version,
        namespace,
        plural,
        name,
    })
    return resp as Resource
}
