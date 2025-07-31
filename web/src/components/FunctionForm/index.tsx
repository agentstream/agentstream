'use client';

import { Module } from '@/common/enum';
import { noticeUnhandledError, routePathOfOverviewPage } from '@/common/utils';
import { Card, Form, Input } from 'antd';
import { useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { configItemPrefix, formLayout } from '@/common/constants';
import { flattenFunctionConfig, parseResourceData } from '@/common/logics';
import { useUpdateEffect } from 'react-use';
import { useCreateResource, useResourceList } from '@/hooks';
import FormTextField from '../common/FormTextField';
import FormArrayField from '../common/FormArrayField';
import FormOptionField from '../common/FormOptionField';
import FormSubmitButton from '../common/FormSubmitButton';
import { NamespaceContext } from '@/contexts/NamespaceContext';

const FunctionForm = () => {
  // [LoadPackageOptions]
  const { data, isPending, isError, error } = useResourceList(Module.Package);
  noticeUnhandledError(isError, error);
  const allPackagesData = data ?? [];
  const packageOptions = allPackagesData.map(item => {
    const { id, name } = parseResourceData(item);
    return {
      value: id,
      label: name
    };
  }); // [/]
  const [selectedPackage, setPackage] = useState('');
  // [LoadModuleOptions]
  const selectedPackages = allPackagesData.filter(
    item => parseResourceData(item).id === selectedPackage
  );
  const modules = selectedPackages.length === 0 ? [] : selectedPackages[0].spec.modules;
  const moduleOptions = Object.entries(modules).map(item => ({
    value: item[0],
    label: item[1].displayName
  })); // [/]
  // [ClearModuleOptionOnPackageOptionChange]
  const [form] = Form.useForm();
  useUpdateEffect(() => {
    form.setFieldValue('module', '');
  }, [form, selectedPackage]); // [/]
  const [selectedModule, selectModule] = useState('');
  const config = Object.entries(selectedPackages[0]?.spec.modules[selectedModule]?.config ?? {});
  const router = useRouter();
  const { mutate } = useCreateResource(Module.Function, () =>
    router.replace(routePathOfOverviewPage(Module.Function))
  );
  const namespaceOptions = useContext(NamespaceContext).map(value => ({ value, label: value }));
  return (
    <Form
      form={form}
      name={Module.Function}
      {...formLayout}
      onFinish={mutate}
      initialValues={flattenFunctionConfig(config)}
    >
      <FormOptionField
        name="namespace"
        warning="Please choose a namespace!"
        options={namespaceOptions}
      />
      <FormTextField name="name" warning={`Please input a ${Module.Function} name!`} />
      <FormTextField name="description" rows={3} />
      <FormOptionField
        name="package"
        warning="Please choose a package!"
        options={packageOptions}
        onChange={setPackage}
      />
      <FormOptionField
        name="module"
        warning="Please choose a module!"
        options={moduleOptions}
        loading={isPending}
        value={selectedModule}
        onChange={selectModule}
        disabled={!selectedPackage}
      />
      <FormArrayField
        name="sources"
        placeholder="Please input topic names split by comma."
        split=","
        ignore=""
      />
      <FormTextField name="sink" placeholder="Please input a topic name." />
      <Form.Item label="Configs" colon={false}>
        {config.length > 0 ? (
          <Card>
            {config.map(([key]) => (
              <FormTextField name={`${configItemPrefix}.${key}`} label={key} key={key} />
            ))}
          </Card>
        ) : (
          <Input value="None" disabled={true} />
        )}
      </Form.Item>
      <FormSubmitButton />
    </Form>
  );
};

export default FunctionForm;
