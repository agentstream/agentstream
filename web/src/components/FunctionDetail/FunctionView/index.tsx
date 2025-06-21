'use client';

import { Module } from '@/common/enum';
import EmptyPlaceHolder from '@/components/common/EmptyPlaceHolder';
import { getFunctionDetails, updateFunction } from '@/server/logics/function';
import { useQuery } from '@tanstack/react-query';
import { Button, Col, Form, Input, Row, Skeleton, Space, Tag } from 'antd';
import { notification } from '@/common/antd';
import { StatusCodes } from 'http-status-codes';
import { formLayout, placement } from '@/common/constants';
import { KubernetesApiRespBody } from '@/common/types';
import { useState } from 'react';
import { flattenFunctionConfig } from '@/common/logics';

type Props = {
  name: string;
  namespace: string;
  inEditing: boolean;
  setInEditing: (inEditing: boolean) => void;
};

const FunctionView = (props: Props) => {
  const [form] = Form.useForm();
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: [Module.Function, props.namespace, props.name],
    queryFn: () => getFunctionDetails(props.namespace, props.name)
  });
  const config = Object.entries(data?.spec.config ?? {});
  const configIsNotEmpty = config.length > 0;
  const name = (data?.spec.displayName || data?.metadata.name) ?? '';
  const [sources, setSources] = useState('');
  const validSources = sources.split(',').filter(source => source !== '');
  function handleCancel() {
    form.resetFields();
    props.setInEditing(false);
  }
  async function handleClick() {
    if (!props.inEditing) {
      props.setInEditing(true);
      return;
    }
    const resp = await updateFunction({
      name,
      package: data?.spec.package ?? '',
      module: data?.spec.module ?? '',
      ...form.getFieldsValue()
    });
    if (resp.code === StatusCodes.OK) {
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
  return isError || !data ? (
    <EmptyPlaceHolder />
  ) : (
    <Form
      form={form}
      name={Module.Function}
      {...formLayout}
      initialValues={{
        description: data.spec.description,
        sources: data.spec.sources.map(item => item.pulsar.topic).join(','),
        sink: data.spec.sink.pulsar.topic,
        ...flattenFunctionConfig(config)
      }}
    >
      <Form.Item label="Name">
        {isPending ? <Skeleton.Input /> : <Tag color="blue">{name} </Tag>}
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
      <Form.Item label="Package">
        {isPending ? <Skeleton.Input /> : <Tag color="blue">{data.spec.package}</Tag>}
      </Form.Item>
      <Form.Item label="Module">
        {isPending ? <Skeleton.Input /> : <Tag color="blue">{data.spec.module}</Tag>}
      </Form.Item>
      <Form.Item label="Sources" name="sources">
        {isPending ? (
          <Skeleton.Input />
        ) : props.inEditing ? (
          <Input
            placeholder="Please input topic names split by comma."
            value={sources}
            onChange={event => setSources(event.target.value)}
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
      {isPending ? (
        <Skeleton />
      ) : (
        <>
          <Form.Item label="Configs" colon={false}>
            {configIsNotEmpty ? null : <Tag>None</Tag>}
          </Form.Item>
          {configIsNotEmpty
            ? config.map(([key, value]) => (
                <Form.Item label={key} key={key} name={`config.${key}`}>
                  {props.inEditing ? <Input /> : <Tag color="blue">{value}</Tag>}
                </Form.Item>
              ))
            : null}
        </>
      )}
      <Form.Item label={null}>
        <Row>
          <Col span={props.inEditing ? 20 : 22} />
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

export default FunctionView;
