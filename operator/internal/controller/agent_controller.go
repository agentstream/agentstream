/*
Copyright 2025.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package controller

import (
	"context"
	"fmt"
	"reflect"

	fsv1alpha1 "github.com/FunctionStream/function-stream/operator/api/v1alpha1"
	fsutils "github.com/FunctionStream/function-stream/operator/utils"
	v1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/json"
	"sigs.k8s.io/controller-runtime/pkg/builder"
	"sigs.k8s.io/controller-runtime/pkg/predicate"

	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	logf "sigs.k8s.io/controller-runtime/pkg/log"

	asv1alpha1 "github.com/agentstream/agentstream/operator/api/v1alpha1"
)

type Config struct {
	PulsarServiceURL string
	PulsarAuthPlugin string
	PulsarAuthParams string
}

// AgentReconciler reconciles a Agent object
type AgentReconciler struct {
	client.Client
	Scheme *runtime.Scheme
	Config Config
}

const agentPackageName = "agent"
const agentModuleName = "agent"

// +kubebuilder:rbac:groups=as.agentstream.github.io,resources=agents,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=as.agentstream.github.io,resources=agents/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=as.agentstream.github.io,resources=agents/finalizers,verbs=update
// +kubebuilder:rbac:groups=fs.functionstream.github.io,resources=functions,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=fs.functionstream.github.io,resources=functions/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=fs.functionstream.github.io,resources=packages,verbs=get;list;watch

// Reconcile is part of the main kubernetes reconciliation loop which aims to
// move the current state of the cluster closer to the desired state.
// TODO(user): Modify the Reconcile function to compare the state specified by
// the Agent object against the actual cluster state, and then
// perform operations to make the cluster state reflect the state specified by
// the user.
//
// For more details, check Reconcile and its Result here:
// - https://pkg.go.dev/sigs.k8s.io/controller-runtime@v0.20.4/pkg/reconcile
func (r *AgentReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := logf.FromContext(ctx)
	log.Info("Reconciling Agent", "agent", req.NamespacedName)

	var agent asv1alpha1.Agent
	if err := r.Get(ctx, req.NamespacedName, &agent); err != nil {
		if errors.IsNotFound(err) {
			return ctrl.Result{}, nil
		}
		return ctrl.Result{}, err
	}

	functionCfg, err := r.buildFunctionConfig(ctx, &agent)
	if err != nil {
		return ctrl.Result{}, fmt.Errorf("failed to build function config for agent %s: %v", agent.Name, err)
	}

	labels := map[string]string{
		"agent": agent.Name,
	}

	function := &fsv1alpha1.Function{
		ObjectMeta: metav1.ObjectMeta{
			Name:      agent.Name,
			Namespace: agent.Namespace,
			Labels:    labels,
		},
		Spec: fsv1alpha1.FunctionSpec{
			DisplayName:      agent.Spec.DisplayName,
			Description:      agent.Spec.Description,
			Package:          agentPackageName,
			Module:           agentModuleName,
			SubscriptionName: agent.Spec.SubscriptionName,
			Sources:          agent.Spec.Sources,
			RequestSource:    agent.Spec.RequestSource,
			Sink:             agent.Spec.Sink,
			Config:           functionCfg,
		},
	}
	if err := ctrl.SetControllerReference(&agent, function, r.Scheme); err != nil {
		return ctrl.Result{}, err
	}

	var existing fsv1alpha1.Function
	deployErr := r.Get(ctx, types.NamespacedName{Name: function.Name, Namespace: function.Namespace}, &existing)
	if deployErr == nil {
		// Only update if spec or labels changed
		if !reflect.DeepEqual(existing.Spec, function.Spec) ||
			!reflect.DeepEqual(existing.Labels, function.Labels) {
			existing.Spec = function.Spec
			existing.Labels = function.Labels
			err = r.Update(ctx, &existing)
			if err != nil {
				return fsutils.HandleReconcileError(log, err, "Conflict when updating Function, will retry automatically")
			}
		}
	} else if errors.IsNotFound(deployErr) {
		err = r.Create(ctx, function)
		if err != nil {
			return fsutils.HandleReconcileError(log, err, "Conflict when creating Function, will retry automatically")
		}
	} else {
		return ctrl.Result{}, deployErr
	}

	if err := r.Get(ctx, types.NamespacedName{Name: function.Name, Namespace: function.Namespace}, &existing); err == nil {
		agent.Status = convertFunctionStatusToAgentStatus(&existing.Status)
		if err := r.Status().Update(ctx, &agent); err != nil {
			return fsutils.HandleReconcileError(log, err, "Conflict when updating Function status, will retry automatically")
		}
	}

	return ctrl.Result{}, nil
}

func (r *AgentReconciler) buildFunctionConfig(ctx context.Context, agent *asv1alpha1.Agent) (map[string]v1.JSON, error) {
	cfg := map[string]v1.JSON{}

	modelConfigBytes, err := json.Marshal(agent.Spec.Model)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal model configuration: %v", err)
	}
	cfg["model"] = v1.JSON{
		Raw: modelConfigBytes,
	}

	pulsarCfg := map[string]interface{}{
		"serviceUrl": r.Config.PulsarServiceURL,
		"authPlugin": r.Config.PulsarAuthPlugin,
		"authParams": r.Config.PulsarAuthParams,
	}
	pulsarCfgBytes, err := json.Marshal(pulsarCfg)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal configuration: %v", err)
	}
	cfg["pulsarRpc"] = v1.JSON{
		Raw: pulsarCfgBytes,
	}

	responseSourceBytes, err := json.Marshal(agent.Spec.ResponseSource)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal response source: %v", err)
	}
	cfg["responseSource"] = v1.JSON{
		Raw: responseSourceBytes,
	}

	agentCtx, err := r.buildAgentContext(ctx, agent)
	if err != nil {
		return nil, err
	}

	agentCtxBytes, err := json.Marshal(agentCtx)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal agent context: %v", err)
	}
	cfg["agent"] = v1.JSON{
		Raw: agentCtxBytes,
	}

	return cfg, nil

}

// FSFunctionToolContext represents the context for a function tool.
type FSFunctionToolContext struct {
	Description   string  `json:"description"`
	SourceSchema  *string `json:"sourceSchema,omitempty"`
	SinkSchema    *string `json:"sinkSchema,omitempty"`
	RequestSource string  `json:"requestSource"`
}

// ProcessCallback represents a callback for post-processing.
type ProcessCallback struct {
	Jsonnet string `json:"jsonnet"`
}

// AgentContext represents the context for an agent.
type AgentContext struct {
	Name        string                            `json:"name"`
	Description string                            `json:"description"`
	Instruction string                            `json:"instruction"`
	Tools       map[string]*FSFunctionToolContext `json:"tools,omitempty"`
	PostProcess *ProcessCallback                  `json:"post_process,omitempty"`
}

func normalizeAgentName(name string) string {
	if name == "" {
		return "_"
	}

	// Convert to runes for proper Unicode handling
	runes := []rune(name)
	result := make([]rune, 0, len(runes))

	for i, r := range runes {
		if i == 0 {
			// First character must be a letter or underscore
			if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || r == '_' {
				result = append(result, r)
			} else if r >= '0' && r <= '9' {
				// If it starts with a digit, prefix with underscore
				result = append(result, '_', r)
			} else {
				// For any other character, replace with underscore
				result = append(result, '_')
			}
		} else {
			// Subsequent characters can be letters, digits, or underscores
			if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '_' {
				result = append(result, r)
			} else {
				// Replace invalid characters with underscore
				result = append(result, '_')
			}
		}
	}

	// Convert back to string
	return string(result)
}

func (r *AgentReconciler) buildAgentContext(ctx context.Context, agent *asv1alpha1.Agent) (*AgentContext, error) {
	agentCtx := &AgentContext{}
	agentCtx.Name = normalizeAgentName(agent.Name)
	agentCtx.Description = agent.Spec.Description
	agentCtx.Instruction = agent.Spec.Instruction

	for _, toolName := range agent.Spec.Tools {
		toolCtx, err := r.buildFSFunctionToolContext(ctx, agent, toolName)
		if err != nil {
			return nil, fmt.Errorf("failed to build tool context for %s: %v", toolName.String(), err)
		}
		if agentCtx.Tools == nil {
			agentCtx.Tools = make(map[string]*FSFunctionToolContext)
		}
		agentCtx.Tools[toolName.Name] = toolCtx
	}

	if agent.Spec.PostProcess != nil {
		agentCtx.PostProcess = &ProcessCallback{
			Jsonnet: agent.Spec.PostProcess.Jsonnet,
		}
	}

	return agentCtx, nil
}

func (r *AgentReconciler) buildFSFunctionToolContext(ctx context.Context, agent *asv1alpha1.Agent, toolName asv1alpha1.NamespacedName) (*FSFunctionToolContext, error) {
	var f fsv1alpha1.Function
	if err := r.Get(ctx, toolName.GetNamespacedName(agent.Namespace), &f); err != nil {
		return nil, fmt.Errorf("failed to get function %s: %v", toolName.String(), err)
	}

	var p fsv1alpha1.Package
	if err := r.Get(ctx, types.NamespacedName{Name: f.Spec.Package, Namespace: f.Namespace}, &p); err != nil {
		return nil, fmt.Errorf("failed to get package %s: %v", f.Spec.Package, err)
	}

	module, ok := p.Spec.Modules[f.Spec.Module]
	if !ok {
		return nil, fmt.Errorf("module %s not found in package %s", f.Spec.Module, f.Spec.Package)
	}

	toolCtx := &FSFunctionToolContext{
		Description: fmt.Sprintf("%s\n%s", f.Spec.Description, module.Description),
	}

	if module.SourceSchema != "" {
		toolCtx.SourceSchema = &module.SourceSchema
	}

	if module.SinkSchema != "" {
		toolCtx.SinkSchema = &module.SinkSchema
	}

	if f.Spec.RequestSource.Pulsar == nil {
		return nil, fmt.Errorf("function %s does not have a request source", f.Name)
	}

	toolCtx.RequestSource = f.Spec.RequestSource.Pulsar.Topic

	return toolCtx, nil
}

func convertFunctionStatusToAgentStatus(fs *fsv1alpha1.FunctionStatus) asv1alpha1.AgentStatus {
	return asv1alpha1.AgentStatus{
		FunctionStatus: *fs,
	}
}

func hasAgentLabel(obj client.Object) bool {
	labels := obj.GetLabels()
	_, ok := labels["agent"]
	return ok
}

// SetupWithManager sets up the controller with the Manager.
func (r *AgentReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&asv1alpha1.Agent{}).
		Owns(&fsv1alpha1.Function{}, builder.WithPredicates(predicate.NewPredicateFuncs(hasAgentLabel))).
		Named("agent").
		Complete(r)
}
