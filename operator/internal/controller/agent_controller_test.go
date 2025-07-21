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

	fsv1alpha1 "github.com/FunctionStream/function-stream/operator/api/v1alpha1"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"

	asv1alpha1 "github.com/agentstream/agentstream/operator/api/v1alpha1"
)

var _ = Describe("Agent Controller", func() {
	Context("When reconciling a resource", func() {
		const resourceName = "test-agent"
		const namespace = "default"

		ctx := context.Background()
		typeNamespacedName := types.NamespacedName{
			Name:      resourceName,
			Namespace: namespace,
		}

		BeforeEach(func() {
			// Clean up any existing resources
			agent := &asv1alpha1.Agent{}
			if err := k8sClient.Get(ctx, typeNamespacedName, agent); err == nil {
				Expect(k8sClient.Delete(ctx, agent)).To(Succeed())
			}

			function := &fsv1alpha1.Function{}
			if err := k8sClient.Get(ctx, typeNamespacedName, function); err == nil {
				Expect(k8sClient.Delete(ctx, function)).To(Succeed())
			}
		})

		AfterEach(func() {
			// Clean up resources after each test
			agent := &asv1alpha1.Agent{}
			if err := k8sClient.Get(ctx, typeNamespacedName, agent); err == nil {
				Expect(k8sClient.Delete(ctx, agent)).To(Succeed())
			}

			function := &fsv1alpha1.Function{}
			if err := k8sClient.Get(ctx, typeNamespacedName, function); err == nil {
				Expect(k8sClient.Delete(ctx, function)).To(Succeed())
			}
		})

		It("Should handle agent not found gracefully", func() {
			By("Reconciling a non-existent agent")
			controllerReconciler := &AgentReconciler{
				Client: k8sClient,
				Scheme: k8sClient.Scheme(),
				Config: Config{
					PulsarServiceURL: "pulsar://localhost:6650",
					PulsarAuthPlugin: "",
					PulsarAuthParams: "",
				},
			}

			_, err := controllerReconciler.Reconcile(ctx, reconcile.Request{
				NamespacedName: types.NamespacedName{
					Name:      "non-existent-agent",
					Namespace: namespace,
				},
			})
			Expect(err).NotTo(HaveOccurred())
		})

		It("Should handle basic agent reconciliation without external dependencies", func() {
			By("Creating a basic agent resource")
			agent := &asv1alpha1.Agent{
				ObjectMeta: metav1.ObjectMeta{
					Name:      resourceName,
					Namespace: namespace,
				},
				Spec: asv1alpha1.AgentSpec{
					DisplayName: "Test Agent",
					Description: "A test agent for unit testing",
					Instruction: "You are a helpful test agent",
					Model: asv1alpha1.ModelConfig{
						Model: "gpt-3.5-turbo",
					},
				},
			}
			Expect(k8sClient.Create(ctx, agent)).To(Succeed())

			By("Reconciling the created resource")
			controllerReconciler := &AgentReconciler{
				Client: k8sClient,
				Scheme: k8sClient.Scheme(),
				Config: Config{
					PulsarServiceURL: "pulsar://localhost:6650",
					PulsarAuthPlugin: "",
					PulsarAuthParams: "",
				},
			}

			_, err := controllerReconciler.Reconcile(ctx, reconcile.Request{
				NamespacedName: typeNamespacedName,
			})
			Expect(err).NotTo(HaveOccurred())

			// Verify that the Function was created
			function := &fsv1alpha1.Function{}
			Expect(k8sClient.Get(ctx, typeNamespacedName, function)).To(Succeed())
			Expect(function.Name).To(Equal(resourceName))
			Expect(function.Namespace).To(Equal(namespace))
		})

		It("Should handle agent with complex configuration", func() {
			By("Creating an agent with complex configuration")
			agent := &asv1alpha1.Agent{
				ObjectMeta: metav1.ObjectMeta{
					Name:      resourceName,
					Namespace: namespace,
				},
				Spec: asv1alpha1.AgentSpec{
					DisplayName: "Config Test Agent",
					Description: "An agent for testing configuration building",
					Instruction: "Test configuration building",
					Model: asv1alpha1.ModelConfig{
						Model:        "gpt-4",
						GoogleApiKey: "test-api-key",
					},
					SubscriptionName: "test-subscription",
					ResponseSource: &fsv1alpha1.SourceSpec{
						Pulsar: &fsv1alpha1.PulsarSourceSpec{
							Topic: "response-topic",
						},
					},
				},
			}
			Expect(k8sClient.Create(ctx, agent)).To(Succeed())

			By("Testing configuration building")
			controllerReconciler := &AgentReconciler{
				Client: k8sClient,
				Scheme: k8sClient.Scheme(),
				Config: Config{
					PulsarServiceURL: "pulsar://test:6650",
					PulsarAuthPlugin: "org.apache.pulsar.client.impl.auth.AuthenticationToken",
					PulsarAuthParams: "token:test-token",
				},
			}

			// Test the buildFunctionConfig method directly
			cfg, err := controllerReconciler.buildFunctionConfig(ctx, agent)
			Expect(err).NotTo(HaveOccurred())
			Expect(cfg).To(HaveKey("model"))
			Expect(cfg).To(HaveKey("pulsarRpc"))
			Expect(cfg).To(HaveKey("responseSource"))
			Expect(cfg).To(HaveKey("agent"))
		})

		It("Should handle agent with sources and sinks configuration", func() {
			By("Creating an agent with sources and sinks")
			agent := &asv1alpha1.Agent{
				ObjectMeta: metav1.ObjectMeta{
					Name:      resourceName,
					Namespace: namespace,
				},
				Spec: asv1alpha1.AgentSpec{
					DisplayName: "Agent with Sources and Sinks",
					Description: "An agent with input sources and output sinks",
					Instruction: "Process input from sources and output to sinks",
					Model: asv1alpha1.ModelConfig{
						Model: "gpt-4",
					},
					Sources: []fsv1alpha1.SourceSpec{
						{
							Pulsar: &fsv1alpha1.PulsarSourceSpec{
								Topic: "input-topic",
							},
						},
					},
					RequestSource: &fsv1alpha1.SourceSpec{
						Pulsar: &fsv1alpha1.PulsarSourceSpec{
							Topic: "request-topic",
						},
					},
					ResponseSource: &fsv1alpha1.SourceSpec{
						Pulsar: &fsv1alpha1.PulsarSourceSpec{
							Topic: "response-topic",
						},
					},
					Sink: &fsv1alpha1.SinkSpec{
						Pulsar: &fsv1alpha1.PulsarSinkSpec{
							Topic: "output-topic",
						},
					},
				},
			}
			Expect(k8sClient.Create(ctx, agent)).To(Succeed())

			By("Testing configuration building with sources and sinks")
			controllerReconciler := &AgentReconciler{
				Client: k8sClient,
				Scheme: k8sClient.Scheme(),
				Config: Config{
					PulsarServiceURL: "pulsar://localhost:6650",
					PulsarAuthPlugin: "",
					PulsarAuthParams: "",
				},
			}

			cfg, err := controllerReconciler.buildFunctionConfig(ctx, agent)
			Expect(err).NotTo(HaveOccurred())
			Expect(cfg).To(HaveKey("model"))
			Expect(cfg).To(HaveKey("pulsarRpc"))
			Expect(cfg).To(HaveKey("responseSource"))
			Expect(cfg).To(HaveKey("agent"))
		})

		It("Should handle agent with post-process configuration", func() {
			By("Creating an agent with post-process")
			agent := &asv1alpha1.Agent{
				ObjectMeta: metav1.ObjectMeta{
					Name:      resourceName,
					Namespace: namespace,
				},
				Spec: asv1alpha1.AgentSpec{
					DisplayName: "Agent with Post-Process",
					Description: "An agent with post-processing",
					Instruction: "Process and format the response",
					Model: asv1alpha1.ModelConfig{
						Model: "gpt-3.5-turbo",
					},
					PostProcess: &asv1alpha1.PostProcessCallback{
						Jsonnet: `local response = std.parseJson(std.extVar("response")); {"formatted": response.result}`,
					},
				},
			}
			Expect(k8sClient.Create(ctx, agent)).To(Succeed())

			By("Testing configuration building with post-process")
			controllerReconciler := &AgentReconciler{
				Client: k8sClient,
				Scheme: k8sClient.Scheme(),
				Config: Config{
					PulsarServiceURL: "pulsar://localhost:6650",
					PulsarAuthPlugin: "",
					PulsarAuthParams: "",
				},
			}

			cfg, err := controllerReconciler.buildFunctionConfig(ctx, agent)
			Expect(err).NotTo(HaveOccurred())
			Expect(cfg).To(HaveKey("agent"))
		})
	})

	Context("Helper functions", func() {
		It("Should normalize agent names correctly", func() {
			Expect(normalizeAgentName("test-agent")).To(Equal("test_agent"))
			Expect(normalizeAgentName("TestAgent")).To(Equal("TestAgent"))
			Expect(normalizeAgentName("test_agent")).To(Equal("test_agent"))
			Expect(normalizeAgentName("123agent")).To(Equal("_123agent"))
			Expect(normalizeAgentName("agent@test")).To(Equal("agent_test"))
			Expect(normalizeAgentName("")).To(Equal("_"))
		})

		It("Should check agent labels correctly", func() {
			obj := &asv1alpha1.Agent{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"agent": "test-agent",
					},
				},
			}
			Expect(hasAgentLabel(obj)).To(BeTrue())

			obj.Labels = map[string]string{
				"other": "label",
			}
			Expect(hasAgentLabel(obj)).To(BeFalse())

			obj.Labels = nil
			Expect(hasAgentLabel(obj)).To(BeFalse())
		})

		It("Should convert function status to agent status correctly", func() {
			functionStatus := fsv1alpha1.FunctionStatus{
				Replicas:           2,
				ReadyReplicas:      1,
				AvailableReplicas:  1,
				UpdatedReplicas:    2,
				ObservedGeneration: 5,
			}

			agentStatus := convertFunctionStatusToAgentStatus(&functionStatus)
			Expect(agentStatus.FunctionStatus.Replicas).To(Equal(int32(2)))
			Expect(agentStatus.FunctionStatus.ReadyReplicas).To(Equal(int32(1)))
			Expect(agentStatus.FunctionStatus.AvailableReplicas).To(Equal(int32(1)))
			Expect(agentStatus.FunctionStatus.UpdatedReplicas).To(Equal(int32(2)))
			Expect(agentStatus.FunctionStatus.ObservedGeneration).To(Equal(int64(5)))
		})
	})

	Context("Configuration building", func() {
		It("Should build function configuration correctly", func() {
			agent := &asv1alpha1.Agent{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-agent",
					Namespace: "default",
				},
				Spec: asv1alpha1.AgentSpec{
					DisplayName: "Test Agent",
					Description: "A test agent",
					Instruction: "Test instruction",
					Model: asv1alpha1.ModelConfig{
						Model:        "gpt-4",
						GoogleApiKey: "test-key",
					},
					ResponseSource: &fsv1alpha1.SourceSpec{
						Pulsar: &fsv1alpha1.PulsarSourceSpec{
							Topic: "response-topic",
						},
					},
				},
			}

			controllerReconciler := &AgentReconciler{
				Client: k8sClient,
				Scheme: k8sClient.Scheme(),
				Config: Config{
					PulsarServiceURL: "pulsar://test:6650",
					PulsarAuthPlugin: "test-plugin",
					PulsarAuthParams: "test-params",
				},
			}

			cfg, err := controllerReconciler.buildFunctionConfig(ctx, agent)
			Expect(err).NotTo(HaveOccurred())

			// Check that all expected configuration keys are present
			Expect(cfg).To(HaveKey("model"))
			Expect(cfg).To(HaveKey("pulsarRpc"))
			Expect(cfg).To(HaveKey("responseSource"))
			Expect(cfg).To(HaveKey("agent"))

			// Verify the configuration contains valid JSON
			Expect(cfg["model"].Raw).NotTo(BeEmpty())
			Expect(cfg["pulsarRpc"].Raw).NotTo(BeEmpty())
			Expect(cfg["responseSource"].Raw).NotTo(BeEmpty())
			Expect(cfg["agent"].Raw).NotTo(BeEmpty())
		})

		It("Should set default response source when ResponseSource is nil", func() {
			agent := &asv1alpha1.Agent{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-agent-no-response",
					Namespace: "default",
				},
				Spec: asv1alpha1.AgentSpec{
					DisplayName: "Test Agent No Response",
					Description: "A test agent without response source",
					Instruction: "Test instruction",
					Model: asv1alpha1.ModelConfig{
						Model:        "gpt-4",
						GoogleApiKey: "test-key",
					},
					// ResponseSource is intentionally nil
				},
			}

			// Create the agent in the database first
			Expect(k8sClient.Create(ctx, agent)).To(Succeed())

			controllerReconciler := &AgentReconciler{
				Client: k8sClient,
				Scheme: k8sClient.Scheme(),
				Config: Config{
					PulsarServiceURL: "pulsar://test:6650",
					PulsarAuthPlugin: "test-plugin",
					PulsarAuthParams: "test-params",
				},
			}

			// Call the public Reconcile method to test the real reconcile logic
			_, err := controllerReconciler.Reconcile(ctx, reconcile.Request{
				NamespacedName: types.NamespacedName{
					Name:      agent.Name,
					Namespace: agent.Namespace,
				},
			})
			Expect(err).NotTo(HaveOccurred())

			// Verify that the agent now has a ResponseSource set by checking the updated resource
			updatedAgent := &asv1alpha1.Agent{}
			Expect(k8sClient.Get(ctx, types.NamespacedName{
				Name:      agent.Name,
				Namespace: agent.Namespace,
			}, updatedAgent)).To(Succeed())

			Expect(updatedAgent.Spec.ResponseSource).NotTo(BeNil())
			Expect(updatedAgent.Spec.ResponseSource.Pulsar).NotTo(BeNil())
			Expect(updatedAgent.Spec.ResponseSource.Pulsar.Topic).To(ContainSubstring("non-persistent://public/default/response-source-test-agent-no-response-"))

			// Verify that the Function was created
			function := &fsv1alpha1.Function{}
			Expect(k8sClient.Get(ctx, types.NamespacedName{
				Name:      agent.Name,
				Namespace: agent.Namespace,
			}, function)).To(Succeed())

			// Clean up
			Expect(k8sClient.Delete(ctx, agent)).To(Succeed())
		})

		It("Should throw error when ResponseSource.Pulsar is nil", func() {
			agent := &asv1alpha1.Agent{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-agent-nil-pulsar",
					Namespace: "default",
				},
				Spec: asv1alpha1.AgentSpec{
					DisplayName: "Test Agent Nil Pulsar",
					Description: "A test agent with nil Pulsar in ResponseSource",
					Instruction: "Test instruction",
					Model: asv1alpha1.ModelConfig{
						Model:        "gpt-4",
						GoogleApiKey: "test-key",
					},
					ResponseSource: &fsv1alpha1.SourceSpec{
						// Pulsar is intentionally nil
					},
				},
			}

			// Create the agent in the database first
			Expect(k8sClient.Create(ctx, agent)).To(Succeed())

			controllerReconciler := &AgentReconciler{
				Client: k8sClient,
				Scheme: k8sClient.Scheme(),
				Config: Config{
					PulsarServiceURL: "pulsar://test:6650",
					PulsarAuthPlugin: "test-plugin",
					PulsarAuthParams: "test-params",
				},
			}

			// Call the public Reconcile method to test the real reconcile logic
			_, err := controllerReconciler.Reconcile(ctx, reconcile.Request{
				NamespacedName: types.NamespacedName{
					Name:      agent.Name,
					Namespace: agent.Namespace,
				},
			})
			// Should fail with validation error
			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("invalid ResponseSource configuration: ResponseSource is set but Pulsar is nil or Topic is empty"))

			// Clean up
			Expect(k8sClient.Delete(ctx, agent)).To(Succeed())
		})

		It("Should throw error when ResponseSource.Pulsar.Topic is empty", func() {
			agent := &asv1alpha1.Agent{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-agent-empty-topic",
					Namespace: "default",
				},
				Spec: asv1alpha1.AgentSpec{
					DisplayName: "Test Agent Empty Topic",
					Description: "A test agent with empty topic in ResponseSource",
					Instruction: "Test instruction",
					Model: asv1alpha1.ModelConfig{
						Model:        "gpt-4",
						GoogleApiKey: "test-key",
					},
					ResponseSource: &fsv1alpha1.SourceSpec{
						Pulsar: &fsv1alpha1.PulsarSourceSpec{
							Topic: "", // Empty topic
						},
					},
				},
			}

			// Create the agent in the database first
			Expect(k8sClient.Create(ctx, agent)).To(Succeed())

			controllerReconciler := &AgentReconciler{
				Client: k8sClient,
				Scheme: k8sClient.Scheme(),
				Config: Config{
					PulsarServiceURL: "pulsar://test:6650",
					PulsarAuthPlugin: "test-plugin",
					PulsarAuthParams: "test-params",
				},
			}

			// Call the public Reconcile method to test the real reconcile logic
			_, err := controllerReconciler.Reconcile(ctx, reconcile.Request{
				NamespacedName: types.NamespacedName{
					Name:      agent.Name,
					Namespace: agent.Namespace,
				},
			})
			// Should fail with validation error
			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("invalid ResponseSource configuration: ResponseSource is set but Pulsar is nil or Topic is empty"))

			// Clean up
			Expect(k8sClient.Delete(ctx, agent)).To(Succeed())
		})

		It("Should handle agent context building", func() {
			agent := &asv1alpha1.Agent{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-agent",
					Namespace: "default",
				},
				Spec: asv1alpha1.AgentSpec{
					DisplayName: "Test Agent",
					Description: "A test agent",
					Instruction: "Test instruction",
					Model: asv1alpha1.ModelConfig{
						Model: "gpt-4",
					},
					PostProcess: &asv1alpha1.PostProcessCallback{
						Jsonnet: "test-jsonnet",
					},
				},
			}

			controllerReconciler := &AgentReconciler{
				Client: k8sClient,
				Scheme: k8sClient.Scheme(),
				Config: Config{},
			}

			agentCtx, err := controllerReconciler.buildAgentContext(ctx, agent)
			Expect(err).NotTo(HaveOccurred())
			Expect(agentCtx.Name).To(Equal("test_agent"))
			Expect(agentCtx.Description).To(Equal("A test agent"))
			Expect(agentCtx.Instruction).To(Equal("Test instruction"))
			Expect(agentCtx.PostProcess).NotTo(BeNil())
			Expect(agentCtx.PostProcess.Jsonnet).To(Equal("test-jsonnet"))
		})
	})
})
