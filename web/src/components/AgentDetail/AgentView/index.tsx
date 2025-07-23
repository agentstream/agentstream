'use client';

import { formLayout } from '@/common/constants';
import { googleAIModels, Module } from '@/common/enum';
import { parseResourceData } from '@/common/logics';
import { noticeUnhandledError } from '@/common/utils';
import EditableViewArrayField from '@/components/common/EditableViewArrayField';
import EditableViewOptionField from '@/components/common/EditableViewOptionField';
import EditableViewTextField from '@/components/common/EditableViewTextField';
import EmptyPlaceHolder from '@/components/common/EmptyPlaceHolder';
import ViewSubmitButton from '@/components/common/ViewSubmitButton';
import ViewTextField from '@/components/common/ViewTextField';
import { useResourceDetails, useResourceList, useUpdateResource } from '@/hooks';
import { Card, Form } from 'antd';
import { useState } from 'react';

type Props = {
  name: string;
  namespace: string;
  inEditing: boolean;
  setInEditing: (inEditing: boolean) => void;
};

const AgentView = (props: Props) => {
  const [form] = Form.useForm();
  const { data, isPending, isError, error, refetch } = useResourceDetails(
    Module.Agent,
    props.namespace,
    props.name
  );
  noticeUnhandledError(isError, error);
  const {
    data: funcResp,
    isPending: funcIsPending,
    isError: funcIsError,
    error: funcError
  } = useResourceList(Module.Function);
  noticeUnhandledError(funcIsError, funcError);
  const allFunctionsData = funcResp ?? [];
  const funcNames = allFunctionsData
    .map(f => ({
      [`${f.metadata.namespace}/${f.metadata.name}`]: f.spec.displayName
    }))
    .reduce((obj1, obj2) => ({ ...obj1, ...obj2 }), {});
  function handleCancel() {
    form.resetFields();
    props.setInEditing(false);
  }
  const { mutate } = useUpdateResource(Module.Agent, () => {
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
  const description = data?.spec.description ?? '';
  const model = data?.spec.model.model ?? '';
  const googleApiKey = data?.spec.model.googleApiKey ?? '';
  const instruction = data?.spec.instruction ?? '';
  const sources = (data?.spec.sources ?? []).map(item => item.pulsar?.topic ?? '').join(',');
  const sink = data?.spec.sink?.pulsar?.topic ?? '';
  const functions = (data?.spec.tools ?? []).map(tool => `${tool.namespace}/${tool.name}`);
  return isError || !data ? (
    <EmptyPlaceHolder />
  ) : (
    <Form
      form={form}
      name={Module.Agent}
      {...formLayout}
      initialValues={{
        description,
        model,
        googleApiKey,
        instruction,
        sources,
        sink,
        functions
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
      <EditableViewOptionField
        name="model"
        options={modelOptions}
        loading={isPending}
        editing={props.inEditing}
        display={[model]}
      />
      <EditableViewTextField
        label="Google API Key"
        name="googleApiKey"
        loading={isPending}
        editing={props.inEditing}
        display={googleApiKey}
      />
      <EditableViewTextField
        label="Instructions"
        name="instruction"
        rows={3}
        loading={isPending}
        editing={props.inEditing}
        display={instruction}
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
      <Form.Item label="Tools" colon={false}>
        <Card>
          <EditableViewOptionField
            name="functions"
            options={functionOptions}
            loading={isPending || funcIsPending}
            value={selectedFunctions}
            onChange={selectFunction}
            multiple={true}
            editing={props.inEditing}
            display={functions.map(id => funcNames[id]!)}
          />
        </Card>
      </Form.Item>
      <ViewSubmitButton
        editing={props.inEditing}
        handleCancel={handleCancel}
        handleSubmit={handleSubmit}
      />
    </Form>
  );
};

export default AgentView;
