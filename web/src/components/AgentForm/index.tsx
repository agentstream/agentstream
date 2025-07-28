'use client';

import { formLayout } from '@/common/constants';
import { googleAIModels, Module } from '@/common/enum';
import { parseResourceData } from '@/common/logics';
import { noticeUnhandledError, routePathOfOverviewPage } from '@/common/utils';
import { useCreateResource, useResourceList } from '@/hooks';
import { Card, Form } from 'antd';
import { useRouter } from 'next/navigation';
import FormTextField from '../common/FormTextField';
import FormArrayField from '../common/FormArrayField';
import FormOptionField from '../common/FormOptionField';
import FormSubmitButton from '../common/FormSubmitButton';
import { useContext } from 'react';
import { NamespaceContext } from '@/contexts/NamespaceContext';

const AgentForm = () => {
  // [LoadFunctionOptions]
  const { data, isPending, isError, error } = useResourceList(Module.Function);
  noticeUnhandledError(isError, error);
  const functionOptions = (data ?? []).map(item => {
    const { id, name } = parseResourceData(item);
    return {
      value: id,
      label: name
    };
  }); // [/]
  const router = useRouter();
  const { mutate } = useCreateResource(Module.Agent, () =>
    router.replace(routePathOfOverviewPage(Module.Agent))
  );
  const namespaceOptions = useContext(NamespaceContext).map(value => ({ value, label: value }));
  const [form] = Form.useForm();
  return (
    <Form form={form} name={Module.Agent} {...formLayout} onFinish={mutate}>
      <FormOptionField
        name="namespace"
        warning="Please choose a namespace!"
        options={namespaceOptions}
      />
      <FormTextField name="name" warning={`Please input a ${Module.Agent} name!`} />
      <FormTextField name="description" rows={3} warning="Description cannot be empty!" />
      <FormOptionField
        name="model"
        warning="Please choose a model!"
        options={googleAIModels.map(value => ({
          value,
          label: value
        }))}
      />
      <FormTextField
        name="googleApiKey"
        label="Google API Key"
        warning="API Key cannot be empty!"
      />
      <FormTextField
        name="instruction"
        label="Instructions"
        warning="Instructions cannot be empty!"
        rows={3}
        placeholder="Input prompts to describe the agent how to work and how to use the tools."
      />
      <FormArrayField
        name="sources"
        placeholder="Please input topic names split by comma."
        split=","
        ignore=""
      />
      <FormTextField name="sink" placeholder="Please input a topic name." />
      <Form.Item label="Tools" colon={false}>
        <Card>
          <FormOptionField
            name="functions"
            options={functionOptions}
            loading={isPending}
            multiple={true}
          />
        </Card>
      </Form.Item>
      <FormSubmitButton />
    </Form>
  );
};
export default AgentForm;
