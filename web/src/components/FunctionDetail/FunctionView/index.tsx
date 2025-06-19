'use client';

import { Module } from '@/common/enum';
import EmptyPlaceHolder from '@/components/common/EmptyPlaceHolder';
import { getFunctionDetails } from '@/server/logics/function';
import { useQuery } from '@tanstack/react-query';
import { Form, Skeleton, Tag } from 'antd';

type Props = {
  name: string;
  namespace: string;
};

const FunctionView = (props: Props) => {
  const [form] = Form.useForm();
  const { data, isPending, isError } = useQuery({
    queryKey: [Module.Function, props.namespace, props.name],
    queryFn: () => getFunctionDetails(props.namespace, props.name)
  });
  const config = Object.entries(data?.spec.config ?? {});
  const configIsNotEmpty = config.length > 0;
  return isError || !data ? (
    <EmptyPlaceHolder />
  ) : (
    <Form
      form={form}
      name={Module.Function}
      labelCol={{
        xs: { span: 24 },
        sm: { span: 6 },
        md: { span: 4 },
        lg: { span: 4 },
        xl: { span: 3 },
        xxl: { span: 2 }
      }}
      wrapperCol={{
        xs: { span: 24 },
        sm: { span: 18 },
        md: { span: 20 },
        lg: { span: 18 },
        xl: { span: 19 },
        xxl: { span: 20 }
      }}
    >
      <Form.Item label="Name" name="name">
        {isPending ? (
          <Skeleton.Input />
        ) : (
          <Tag color="blue">{data.spec.displayName || data.metadata.name} </Tag>
        )}
      </Form.Item>
      <Form.Item label="Description" name="description">
        {isPending ? <Skeleton.Input /> : <Tag color="blue">{data.spec.description}</Tag>}
      </Form.Item>
      <Form.Item label="Package" name="package">
        {isPending ? <Skeleton.Input /> : <Tag color="blue">{data.spec.package}</Tag>}
      </Form.Item>
      <Form.Item label="Module" name="module">
        {isPending ? <Skeleton.Input /> : <Tag color="blue">{data.spec.module}</Tag>}
      </Form.Item>
      <Form.Item label="Sources" name="sources">
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
      <Form.Item label="Sink" name="sink">
        {isPending ? <Skeleton.Input /> : <Tag color="blue">{data.spec.sink.pulsar.topic}</Tag>}
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
                  <Tag color="blue">{value}</Tag>
                </Form.Item>
              ))
            : null}
        </>
      )}
    </Form>
  );
};
export default FunctionView;
