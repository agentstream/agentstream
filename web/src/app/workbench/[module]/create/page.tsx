'use client';

import { Module } from '@/common/enum';
import { parseResourceData, routePathOfOverviewPage } from '@/common/utils';
import { useModule } from '@/hooks';
import { createFunction } from '@/server/logics/function';
import { listAllPackages } from '@/server/logics/package';
import { useQuery } from '@tanstack/react-query';
import { Button, Col, Form, Input, Row, Select, Tag } from 'antd';
import { notification } from '@/common/antd';
import { StatusCodes } from 'http-status-codes';
import { notFound, redirect, RedirectType } from 'next/navigation';
import { useState } from 'react';
import { KubernetesApiRespBody } from '@/common/types';
import { placement } from '@/common/constants';

const validModules = [Module.Function, Module.Agent];

export default function Page() {
  const mod = useModule();
  if (!validModules.includes(mod)) {
    notFound();
  }
  const [form] = Form.useForm();
  const { data, isPending } = useQuery({
    queryKey: [mod, 'create'],
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
  return mod === Module.Function ? (
    <Form
      form={form}
      name={mod}
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
      onFinish={handleSubmit}
    >
      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: `Please input a ${mod} name!` }]}
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
        ? config.map(([key, value]) => (
            <Form.Item label={key} key={key} name={`config.${key}`}>
              <Input defaultValue={value} />
            </Form.Item>
          ))
        : null}
      <Form.Item label={null}>
        <Row>
          <Col span={22} />
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Row>
      </Form.Item>
    </Form>
  ) : null;
}
