'use client';

import { formLayout, placement } from '@/common/constants';
import { googleAIModels, Module } from '@/common/enum';
import { CreateAgentForm, KubernetesApiRespBody } from '@/common/types';
import { isRequestSuccess, parseResourceData, routePathOfOverviewPage } from '@/common/utils';
import { createAgent } from '@/server/logics/agent';
import { listAllFunctions } from '@/server/logics/function';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Form, Input, notification, Row, Select, Space, Tag } from 'antd';
import { redirect, RedirectType, useRouter } from 'next/navigation';
import { useState } from 'react';

const AgentForm = () => {
  const [form] = Form.useForm();
  const { data, isPending } = useQuery({
    queryKey: [Module.Agent, 'create'],
    queryFn: listAllFunctions
  });
  const allFunctionsData = data?.items ?? [];
  const modelOptions = googleAIModels.map(value => ({
    value,
    label: value
  }));
  const functionOptions = allFunctionsData.map(item => {
    const { id, name } = parseResourceData(item);
    return {
      value: id,
      label: name
    };
  });
  const [selectedFunctions, selectFunction] = useState('');
  const [sources, setSources] = useState('');
  const validSources = sources.split(',').filter(source => source !== '');
  const router = useRouter();
  async function handleSubmit(form: CreateAgentForm) {
    const resp = await createAgent(form);
    if (isRequestSuccess(resp)) {
      notification.success({
        message: 'Creation Success!',
        placement
      });
      redirect(routePathOfOverviewPage(Module.Agent), RedirectType.push);
    } else {
      notification.error({
        message: 'Creation failed!',
        description: (resp.data as KubernetesApiRespBody).message,
        placement
      });
    }
  }
  return (
    <Form form={form} name={Module.Agent} {...formLayout} onFinish={handleSubmit}>
      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: `Please input a ${Module.Agent} name!` }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="Description"
        name="description"
        rules={[{ required: true, message: `description cannot be empty!` }]}
      >
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item
        label="Model"
        name="model"
        rules={[{ required: true, message: `please choose a model!` }]}
      >
        <Select options={modelOptions} />
      </Form.Item>
      <Form.Item
        label="Google API Key"
        name="googleApiKey"
        rules={[{ required: true, message: `please input an google api key here!` }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="Instructions"
        name="instruction"
        rules={[{ required: true, message: `instructions cannot be empty!` }]}
      >
        <Input.TextArea
          rows={3}
          placeholder="Input prompts to describe the agent how to work and how to use the tools."
        />
      </Form.Item>
      <Form.Item label="Sources" name="sources">
        <Input
          placeholder="Please input topic names split by comma."
          value={sources}
          onChange={event => setSources(event.target.value)}
        />
      </Form.Item>
      {validSources.length > 0 ? (
        <Form.Item label=" " colon={false}>
          {validSources.map(source => (
            <Tag key={source} color="blue">
              {source}
            </Tag>
          ))}
        </Form.Item>
      ) : null}
      <Form.Item label="Sink" name="sink">
        <Input placeholder="Please input a topic name." />
      </Form.Item>
      <Form.Item label="Tools" colon={false}>
        <Card>
          <Form.Item label="Functions" name="functions">
            <Select
              options={functionOptions}
              loading={isPending}
              value={selectedFunctions}
              onChange={selectFunction}
              mode="multiple"
            />
          </Form.Item>
        </Card>
      </Form.Item>
      <Form.Item label={null}>
        <Row justify="end">
          <Space>
            <Button onClick={router.back}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Space>
        </Row>
      </Form.Item>
    </Form>
  );
};
export default AgentForm;
