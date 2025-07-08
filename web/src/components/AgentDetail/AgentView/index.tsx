'use client';

import { formLayout } from '@/common/constants';
import { Module } from '@/common/enum';
import EmptyPlaceHolder from '@/components/common/EmptyPlaceHolder';
import { getAgentDetails } from '@/server/logics/agent';
import { listAllFunctions } from '@/server/logics/function';
import { useQuery } from '@tanstack/react-query';
import { Card, Form, Skeleton, Tag } from 'antd';

type Props = {
  name: string;
  namespace: string;
  inEditing: boolean;
  setInEditing: (inEditing: boolean) => void;
};

const AgentView = (props: Props) => {
  const [form] = Form.useForm();
  const { data, isPending, isError } = useQuery({
    queryKey: [Module.Agent, props.namespace, props.name],
    queryFn: () => getAgentDetails(props.namespace, props.name)
  });
  const { data: funcData, isPending: funcIsPending } = useQuery({
    queryKey: [Module.Agent, 'config'],
    queryFn: listAllFunctions
  });
  const funcNames = (funcData?.items ?? [])
    .map(f => ({
      [`${f.metadata.namespace}/${f.metadata.name}`]: f.spec.displayName
    }))
    .reduce((obj1, obj2) => ({ ...obj1, ...obj2 }), {});
  const name = (data?.spec.displayName || data?.metadata.name) ?? '';
  return isError || !data ? (
    <EmptyPlaceHolder />
  ) : (
    <Form form={form} name={Module.Agent} {...formLayout}>
      <Form.Item label="Name">
        {isPending ? <Skeleton.Input /> : <Tag color="blue">{name}</Tag>}
      </Form.Item>
      <Form.Item label="Description" name="description">
        {isPending ? <Skeleton.Input /> : <Tag color="blue">{data.spec.description}</Tag>}
      </Form.Item>
      <Form.Item label="Model">
        {isPending ? <Skeleton.Input /> : <Tag color="blue">{data.spec.model.model}</Tag>}
      </Form.Item>
      <Form.Item label="Google API Key">
        {isPending ? <Skeleton.Input /> : <Tag color="blue">{data.spec.model.googleApiKey}</Tag>}
      </Form.Item>
      <Form.Item label="Instructions">
        {isPending ? <Skeleton.Input /> : <Tag color="blue">{data.spec.instruction}</Tag>}
      </Form.Item>
      <Form.Item label="Sources">
        {isPending ? (
          <Skeleton.Input />
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
      <Form.Item label="Sink">
        {isPending ? <Skeleton.Input /> : <Tag color="blue">{data.spec.sink.pulsar.topic}</Tag>}
      </Form.Item>
      <Form.Item label="Tools" colon={false}>
        <Card>
          <Form.Item label="Functions">
            {isPending || funcIsPending ? (
              <Skeleton />
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
    </Form>
  );
};

export default AgentView;
