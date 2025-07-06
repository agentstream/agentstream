'use client';

import { Module } from '@/common/enum';
import { parseResourceData, routePathOfOverviewPage } from '@/common/utils';
import { createFunction } from '@/server/logics/function';
import { listAllPackages } from '@/server/logics/package';
import { useQuery } from '@tanstack/react-query';
import { Button, Form, Input, Row, Select, Space, Tag } from 'antd';
import { notification } from '@/common/antd';
import { StatusCodes } from 'http-status-codes';
import { useState } from 'react';
import { redirect, RedirectType, useRouter } from 'next/navigation';
import { KubernetesApiRespBody } from '@/common/types';
import { formLayout, placement } from '@/common/constants';
import { flattenFunctionConfig } from '@/common/logics';
import { useUpdateEffect } from 'react-use';

const FunctionForm = () => {
  const [form] = Form.useForm();
  const { data, isPending } = useQuery({
    queryKey: [Module.Function, 'create'],
    queryFn: listAllPackages
  });
  const allPackagesData = data?.items ?? [];
  const packageOptions = allPackagesData.map(item => {
    const { id, name } = parseResourceData(item);
    return {
      value: id,
      label: name
    };
  });
  const [selectedPackage, selectPackage] = useState('');
  const selectedPackages = allPackagesData.filter(
    item => parseResourceData(item).id === selectedPackage
  );
  const modules = selectedPackages.length === 0 ? [] : selectedPackages[0].spec.modules;
  const moduleOptions = Object.entries(modules).map(item => ({
    value: item[0],
    label: item[1].displayName
  }));
  const [selectedModule, selectModule] = useState('');
  useUpdateEffect(() => {
    form.setFieldValue('module', '');
  }, [form, selectedPackage]);
  const config = Object.entries(selectedPackages[0]?.spec.modules[selectedModule]?.config ?? {});
  const configIsNotEmpty = config.length > 0;
  const [sources, setSources] = useState('');
  const validSources = sources.split(',').filter(source => source !== '');
  async function handleSubmit(form: Record<string, string>) {
    const resp = await createFunction(form);
    if (resp.code === StatusCodes.CREATED) {
      notification.success({
        message: 'Creation Success!',
        placement
      });
      redirect(routePathOfOverviewPage(Module.Function), RedirectType.push);
    } else {
      notification.error({
        message: 'Creation failed!',
        description: (resp.data as KubernetesApiRespBody).message,
        placement
      });
    }
  }
  const router = useRouter();
  return (
    <Form
      form={form}
      name={Module.Function}
      {...formLayout}
      onFinish={handleSubmit}
      initialValues={flattenFunctionConfig(config)}
    >
      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: `Please input a ${Module.Function} name!` }]}
      >
        <Input />
      </Form.Item>
      <Form.Item label="Description" name="description">
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item
        label="Package"
        name="package"
        rules={[{ required: true, message: 'Please choose a package!' }]}
      >
        <Select
          options={packageOptions}
          loading={isPending}
          value={selectedPackage}
          onChange={selectPackage}
        />
      </Form.Item>
      <Form.Item
        label="Module"
        name="module"
        rules={[{ required: true, message: 'Please choose a module!' }]}
      >
        <Select
          options={moduleOptions}
          loading={isPending}
          value={selectedModule}
          onChange={selectModule}
          disabled={!selectedPackage}
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
      <Form.Item label="Configs" colon={false}>
        {configIsNotEmpty ? null : <Input value="None" disabled={true} />}
      </Form.Item>
      {configIsNotEmpty
        ? config.map(([key]) => (
            <Form.Item label={key} key={key} name={`config.${key}`}>
              <Input />
            </Form.Item>
          ))
        : null}
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

export default FunctionForm;
