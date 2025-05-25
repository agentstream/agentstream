export const enum Module {
    Package = 'package',
    Function = 'function',
    Agent = 'agent'
}

export const enum RoutePath {
    Package = `/workbench/${Module.Package}`,
    Function = `/workbench/${Module.Function}`,
    Agent = `/workbench/${Module.Agent}`
}

export const enum TabItem {
    Overview = 'overview',
    Message = 'message',
    Metrics = 'metrics'
}
