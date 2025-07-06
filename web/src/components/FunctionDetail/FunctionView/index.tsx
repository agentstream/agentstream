'use client';

import { Module } from '@/common/enum';
import EmptyPlaceHolder from '@/components/common/EmptyPlaceHolder';
import { getFunctionDetails, updateFunction } from '@/server/logics/function';
import { useQuery } from '@tanstack/react-query';
import { Button, Form, Input, Row, Skeleton, Space, Tag } from 'antd';
import { notification } from '@/common/antd';
import { StatusCodes } from 'http-status-codes';
import { formLayout, placement } from '@/common/constants';
import { KubernetesApiRespBody } from '@/common/types';
import { useEffect, useState } from 'react';
import { flattenFunctionConfig } from '@/common/logics';
import { getPackageDetails } from '@/server/logics/package';

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
  const {
    data: pakData,
    isPending: pakIsPending,
    isError: pakIsError
  } = useQuery({
    queryKey: [Module.Function, props.namespace, data?.spec.package],
    queryFn: () =>
      data?.spec.package ? getPackageDetails(props.namespace, data.spec.package) : null
  });
  const packageName = pakData?.spec.displayName || pakData?.metadata.name;
  const moduleName =
    (pakData?.spec.modules ?? {})[data?.spec.module ?? '']?.displayName ?? data?.spec.module;
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
    const resp = await updateFunction({
      name,
      namespace: props.namespace,
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
        {isPending || pakIsPending ? (
          <Skeleton.Input />
        ) : (
          <Tag color={pakIsError ? 'error' : 'blue'}>{packageName}</Tag>
        )}
      </Form.Item>
      <Form.Item label="Module">
        {isPending ? <Skeleton.Input /> : <Tag color="blue">{moduleName}</Tag>}
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

export default FunctionView;
