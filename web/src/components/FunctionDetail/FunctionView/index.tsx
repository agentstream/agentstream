'use client';

import { Module } from '@/common/enum';
import EmptyPlaceHolder from '@/components/common/EmptyPlaceHolder';
import { Card, Form, Input, Skeleton } from 'antd';
import { configItemPrefix, formLayout } from '@/common/constants';
import { flattenFunctionConfig } from '@/common/logics';
import { noticeUnhandledError } from '@/common/utils';
import { useResourceDetails, useUpdateResource } from '@/hooks';
import ViewTextField from '@/components/common/ViewTextField';
import EditableViewTextField from '@/components/common/EditableViewTextField';
import EditableViewArrayField from '@/components/common/EditableViewArrayField';
import ViewSubmitButton from '@/components/common/ViewSubmitButton';

type Props = {
  name: string;
  namespace: string;
  inEditing: boolean;
  setInEditing: (inEditing: boolean) => void;
};

const FunctionView = (props: Props) => {
  const [form] = Form.useForm();
  const { data, isPending, isError, error, refetch } = useResourceDetails(
    Module.Function,
    props.namespace,
    props.name
  );
  noticeUnhandledError(isError, error);
  const config = Object.entries(data?.spec.config ?? {});
  const configIsNotEmpty = config.length > 0;
  const {
    data: pakData,
    isPending: pakIsPending,
    isError: pakIsError
  } = useResourceDetails(
    Module.Package,
    data?.spec.packageRef?.namespace ?? '',
    data?.spec.packageRef?.name ?? ''
  );
  function handleCancel() {
    form.resetFields();
    props.setInEditing(false);
  }
  const { mutate } = useUpdateResource(Module.Function, () => {
    refetch();
    props.setInEditing(false);
  });
  async function handleSubmit() {
    if (!props.inEditing) {
      props.setInEditing(true);
      return;
    }
    const { name, namespace } = props;
    mutate({
      name,
      namespace,
      ...form.getFieldsValue()
    });
  }
  const description = data?.spec.description ?? '';
  const sources = (data?.spec.sources ?? []).map(item => item.pulsar?.topic ?? '').join(',');
  const sink = data?.spec.sink?.pulsar?.topic ?? '';
  const mod = data?.spec.module ?? '';
  return isError || !data ? (
    <EmptyPlaceHolder />
  ) : (
    <Form
      form={form}
      name={Module.Function}
      {...formLayout}
      initialValues={{
        description,
        sources,
        sink,
        ...flattenFunctionConfig(config)
      }}
    >
      <ViewTextField label="Namespace" value={props.namespace} loading={false} />
      <ViewTextField
        label="Name"
        value={(data?.spec.displayName || data?.metadata.name) ?? ''}
        loading={isPending}
      />
      <EditableViewTextField
        name="description"
        rows={3}
        loading={isPending}
        editing={props.inEditing}
        display={description}
      />
      <ViewTextField
        label="Package"
        value={(pakData?.spec.displayName || pakData?.metadata.name) ?? ''}
        loading={isPending || pakIsPending}
        error={pakIsError}
      />
      <ViewTextField
        label="Module"
        value={(pakData?.spec.modules ?? {})[mod]?.displayName ?? mod}
        loading={isPending}
      />
      <EditableViewArrayField
        name="sources"
        loading={isPending}
        editing={props.inEditing}
        placeholder="Please input topic names split by comma."
        split=","
        ignore=""
        display={sources.split(',')}
      />
      <EditableViewTextField
        name="sink"
        loading={isPending}
        editing={props.inEditing}
        placeholder="Please input a topic name."
        display={sink}
      />
      {isPending ? (
        <Skeleton />
      ) : (
        <Form.Item label="Configs" colon={false}>
          {configIsNotEmpty ? (
            <Card>
              {config.map(([key, value]) => (
                <EditableViewTextField
                  name={`${configItemPrefix}.${key}`}
                  label={key}
                  key={key}
                  loading={isPending}
                  editing={props.inEditing}
                  display={value}
                />
              ))}
            </Card>
          ) : (
            <Input value="None" disabled={true} />
          )}
        </Form.Item>
      )}
      <ViewSubmitButton
        editing={props.inEditing}
        handleCancel={handleCancel}
        handleSubmit={handleSubmit}
      />
    </Form>
  );
};

export default FunctionView;
