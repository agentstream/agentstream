'use client';

import { formLayout, placement } from '@/common/constants';
import { googleAIModels, Module } from '@/common/enum';
import { getDetailsWithNotice, listAllWithNotice, parseResourceData } from '@/common/logics';
import {
  AgentSpec,
  FunctionSpec,
  KubernetesApiRespBody,
  ResourceData,
  ResourceList
} from '@/common/types';
import { noticeUnhandledError, isRequestSuccess } from '@/common/utils';
import EmptyPlaceHolder from '@/components/common/EmptyPlaceHolder';
import { updateAgent } from '@/server/logics/agent';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Form, Input, notification, Row, Select, Skeleton, Space, Tag } from 'antd';
import { useEffect, useState } from 'react';

type Props = {
  name: string;
  namespace: string;
  inEditing: boolean;
  setInEditing: (inEditing: boolean) => void;
};

const AgentView = (props: Props) => {
  const [form] = Form.useForm();
  const {
    data: resp,
    isPending,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: [Module.Agent, props.namespace, props.name],
    queryFn: () => getDetailsWithNotice(Module.Agent, props.namespace, props.name)
  });
  noticeUnhandledError(isError, error);
  const data = resp?.data as ResourceData<AgentSpec>;
  const {
    data: funcResp,
    isPending: funcIsPending,
    isError: funcIsError,
    error: funcError
  } = useQuery({
    queryKey: [Module.Agent, 'config'],
    queryFn: () => listAllWithNotice(Module.Function)
  });
  noticeUnhandledError(funcIsError, funcError);
  const funcData = funcResp?.data as ResourceList<FunctionSpec>;
  const allFunctionsData = funcData?.items ?? [];
  const funcNames = allFunctionsData
    .map(f => ({
      [`${f.metadata.namespace}/${f.metadata.name}`]: f.spec.displayName
    }))
    .reduce((obj1, obj2) => ({ ...obj1, ...obj2 }), {});
  const [sources, setSources] = useState(new Array<string>());
  useEffect(() => {
    if (!props.inEditing) {
      setSources(data?.spec.sources.map(source => source.pulsar.topic) ?? []);
    }
  }, [props.inEditing, data]);
  const validSources = sources.filter(source => source !== '');
  function handleCancel() {
    form.resetFields();
    props.setInEditing(false);
  }
  async function handleClick() {
    if (!props.inEditing) {
      props.setInEditing(true);
      return;
    }
    const resp = await updateAgent({
      name,
      namespace: props.namespace,
      ...form.getFieldsValue()
    });
    if (isRequestSuccess(resp)) {
      notification.success({
        message: 'Update Success!',
        placement
      });
      refetch();
      props.setInEditing(false);
    } else {
      notification.error({
        message: 'Update failed!',
        description: (resp.data as KubernetesApiRespBody).message,
        placement
      });
    }
  }
  const name = (data?.spec.displayName || data?.metadata.name) ?? '';
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
  return isError || !data ? (
    <EmptyPlaceHolder />
  ) : (
    <Form
      form={form}
      name={Module.Agent}
      {...formLayout}
      initialValues={{
        description: data.spec.description,
        model: data.spec.model.model,
        googleApiKey: data.spec.model.googleApiKey,
        instruction: data.spec.instruction,
        sources: data.spec.sources.map(item => item.pulsar.topic).join(','),
        sink: data.spec.sink.pulsar.topic,
        functions: data.spec.tools.map(item => `${item.namespace}/${item.name}`)
      }}
    >
      <Form.Item label="Name">
        {isPending ? <Skeleton.Input /> : <Tag color="blue">{name}</Tag>}
      </Form.Item>
      <Form.Item label="Description" name="description">
        {isPending ? (
          <Skeleton.Input />
        ) : props.inEditing ? (
          <Input.TextArea rows={3} />
        ) : (
          <Tag color="blue">{data.spec.description}</Tag>
        )}
      </Form.Item>
      <Form.Item label="Model" name="model">
        {isPending ? (
          <Skeleton.Input />
        ) : props.inEditing ? (
          <Select options={modelOptions} />
        ) : (
          <Tag color="blue">{data.spec.model.model}</Tag>
        )}
      </Form.Item>
      <Form.Item label="Google API Key" name="googleApiKey">
        {isPending ? (
          <Skeleton.Input />
        ) : props.inEditing ? (
          <Input />
        ) : (
          <Tag color="blue">{data.spec.model.googleApiKey}</Tag>
        )}
      </Form.Item>
      <Form.Item label="Instructions" name="instruction">
        {isPending ? (
          <Skeleton.Input />
        ) : props.inEditing ? (
          <Input.TextArea rows={3} />
        ) : (
          <Tag color="blue">{data.spec.instruction}</Tag>
        )}
      </Form.Item>
      <Form.Item label="Sources" name="sources">
        {isPending ? (
          <Skeleton.Input />
        ) : props.inEditing ? (
          <Input
            placeholder="Please input topic names split by comma."
            value={sources}
            onChange={event => setSources(event.target.value.split(','))}
          />
        ) : (
          data.spec.sources.map(item => {
            const {
              pulsar: { topic }
            } = item;
            return (
              <Tag color="blue" key={topic}>
                {topic}
              </Tag>
            );
          })
        )}
      </Form.Item>
      {props.inEditing && validSources.length > 0 ? (
        <Form.Item label=" " colon={false}>
          {validSources.map(source => (
            <Tag key={source} color="blue">
              {source}
            </Tag>
          ))}
        </Form.Item>
      ) : null}
      <Form.Item label="Sink" name="sink">
        {isPending ? (
          <Skeleton.Input />
        ) : props.inEditing ? (
          <Input placeholder="Please input a topic name." />
        ) : (
          <Tag color="blue">{data.spec.sink.pulsar.topic}</Tag>
        )}
      </Form.Item>
      <Form.Item label="Tools" colon={false}>
        <Card>
          <Form.Item label="Functions" name="functions">
            {isPending || funcIsPending ? (
              <Skeleton />
            ) : props.inEditing ? (
              <Select
                options={functionOptions}
                loading={isPending}
                value={selectedFunctions}
                onChange={selectFunction}
                mode="multiple"
              />
            ) : (
              data.spec.tools.map(f => {
                const id = `${f.namespace}/${f.name}`;
                return (
                  <Tag color="blue" key={id}>
                    {funcNames[id] ?? id}
                  </Tag>
                );
              })
            )}
          </Form.Item>
        </Card>
      </Form.Item>
      <Form.Item label={null}>
        <Row justify="end">
          <Space>
            {props.inEditing ? <Button onClick={handleCancel}>Cancel</Button> : null}
            <Button type="primary" onClick={handleClick}>
              {props.inEditing ? 'Save' : 'Edit'}
            </Button>
          </Space>
        </Row>
      </Form.Item>
    </Form>
  );
};

export default AgentView;
