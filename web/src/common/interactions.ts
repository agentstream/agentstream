import {
    createFunction,
    deleteFunction,
    getFunctionDetails,
    listAllFunctions,
    updateFunction
} from '@/server/logics/function';
import { capitalize, isRequestSuccess } from './utils';
import { notification } from '@/common/antd';
import { placement } from './constants';
import {
    AgentStreamApiResp,
    CreateAgentForm,
    CreateFunctionForm,
    KubernetesApiRespBody,
    ResourceData,
    ResourceList,
    SpecMap,
    UpdateAgentForm,
    UpdateFunctionForm
} from './types';
import {
    createAgent,
    deleteAgent,
    getAgentDetails,
    listAllAgents,
    updateAgent
} from '@/server/logics/agent';
import { Module } from './enum';
import { getPackageDetails, listAllPackages } from '@/server/logics/package';

type ChangableModule = Module.Function | Module.Agent;

type CreateForm = CreateFunctionForm | CreateAgentForm;

function isCreateFunctionForm(module: Module, form: CreateForm): form is CreateFunctionForm {
    return module === Module.Function;
}

function isCreateAgentForm(module: Module, form: CreateForm): form is CreateAgentForm {
    return module === Module.Agent;
}

const enum Mutate {
    Create = 'Create',
    Update = 'Update',
    Delete = 'Delete'
}

function checkMutateResult(module: Module, action: Mutate, resp: AgentStreamApiResp): boolean {
    const resource = capitalize(module);
    const success = isRequestSuccess(resp);
    if (success) {
        notification.success({
            message: `${action} ${resource} Success!`,
            placement
        });
    } else {
        notification.error({
            message: `${action} ${resource} Failed!`,
            description: (resp.data as KubernetesApiRespBody).message,
            placement
        });
    }
    return success;
}

export async function createWithNotice(module: ChangableModule, form: CreateForm) {
    const resp = (await (isCreateFunctionForm(module, form)
        ? createFunction(form)
        : isCreateAgentForm(module, form)
        ? createAgent(form)
        : null)) as AgentStreamApiResp;
    return checkMutateResult(module, Mutate.Create, resp);
}

const deleteAction = {
    [Module.Function]: deleteFunction,
    [Module.Agent]: deleteAgent
};

export async function deleteWithNotice<T extends ChangableModule>(
    module: T,
    name: string,
    namespace: string
) {
    const resp = await deleteAction[module](name, namespace);
    return checkMutateResult(module, Mutate.Delete, resp);
}

type UpdateForm = UpdateFunctionForm | UpdateAgentForm;

function isUpdateFunctionForm(module: Module, form: UpdateForm): form is UpdateFunctionForm {
    return module === Module.Function;
}

function isUpdateAgentForm(module: Module, form: UpdateForm): form is UpdateAgentForm {
    return module === Module.Agent;
}

export async function updateWithNotice(module: ChangableModule, form: UpdateForm) {
    const resp = (await (isUpdateFunctionForm(module, form)
        ? updateFunction(form)
        : isUpdateAgentForm(module, form)
        ? updateAgent(form)
        : null)) as AgentStreamApiResp;
    return checkMutateResult(module, Mutate.Update, resp);
}

function checkQueryResult(module: Module, resp: AgentStreamApiResp): boolean {
    const success = isRequestSuccess(resp);
    if (!success) {
        notification.error({
            message: `Query ${capitalize(module)} Failed!`,
            description: (resp.data as KubernetesApiRespBody)?.message ?? 'Something went wrong!',
            placement
        });
    }
    return success;
}

const listAll = {
    [Module.Package]: listAllPackages,
    [Module.Function]: listAllFunctions,
    [Module.Agent]: listAllAgents
};

export async function listAllWithNotice<T extends Module, U = SpecMap[T]>(module: T) {
    const resp = await listAll[module]();
    return checkQueryResult(module, resp)
        ? (resp as AgentStreamApiResp<ResourceList<U>>)
        : undefined;
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
    return checkQueryResult(module, resp)
        ? (resp as AgentStreamApiResp<ResourceData<U>>)
        : undefined;
}
