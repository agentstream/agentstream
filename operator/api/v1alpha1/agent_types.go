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

package v1alpha1

import (
	fsv1alpha1 "github.com/FunctionStream/function-stream/operator/api/v1alpha1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
)

type NamespacedName struct {
	Namespace *string `json:"namespace,omitempty"`
	Name      string  `json:"name"`
}

func (n *NamespacedName) GetNamespacedName(defaultNs string) types.NamespacedName {
	namespace := defaultNs

	if n.Namespace != nil && *n.Namespace != "" {
		namespace = *n.Namespace
	}

	return types.NamespacedName{
		Name:      n.Name,
		Namespace: namespace,
	}
}

func (n *NamespacedName) String() string {
	if n.Namespace == nil {
		return n.Name
	}
	return *n.Namespace + "/" + n.Name
}

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

type PostProcessCallback struct {
	Jsonnet string `json:"jsonnet,omitempty"`
}

type ModelConfig struct {
	// +kubebuilder:validation:Required
	Model string `json:"model"`

	// +kubebuilder:validation:Optional
	GoogleApiKey string `json:"googleApiKey,omitempty"`
}

// AgentSpec defines the desired state of Agent.
type AgentSpec struct {
	// INSERT ADDITIONAL SPEC FIELDS - desired state of cluster
	// Important: Run "make" to regenerate code after modifying this file

	// Display name of the agent
	// +kubebuilder:validation:Optional
	DisplayName string `json:"displayName,omitempty"`
	// Description of the agent
	Description string `json:"description"`
	// +kubebuilder:validation:Required
	Instruction string `json:"instruction"`
	// +kubebuilder:validation:Required
	Model ModelConfig `json:"model"`
	// +kubebuilder:validation:Optional
	SubscriptionName string `json:"subscriptionName,omitempty"`
	// List of sources
	// +kubebuilder:validation:Optional
	Sources []fsv1alpha1.SourceSpec `json:"sources,omitempty"`
	// Request source
	// +kubebuilder:validation:Optional
	RequestSource *fsv1alpha1.SourceSpec `json:"requestSource,omitempty"`
	// +kubebuilder:validation:Optional
	ResponseSource *fsv1alpha1.SourceSpec `json:"responseSource,omitempty"`
	// Sink specifies the sink configuration
	// +kubebuilder:validation:Optional
	Sink *fsv1alpha1.SinkSpec `json:"sink,omitempty"`

	// +kubebuilder:validation:Optional
	Tools []NamespacedName `json:"tools,omitempty"`

	// +kubebuilder:validation:Optional
	PostProcess *PostProcessCallback `json:"postProcess,omitempty"`
}

// AgentStatus defines the observed state of Agent.
type AgentStatus struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "make" to regenerate code after modifying this file

	FunctionStatus fsv1alpha1.FunctionStatus `json:"functionStatus,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status

// Agent is the Schema for the agents API.
type Agent struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   AgentSpec   `json:"spec,omitempty"`
	Status AgentStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// AgentList contains a list of Agent.
type AgentList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Agent `json:"items"`
}

func init() {
	SchemeBuilder.Register(&Agent{}, &AgentList{})
}
