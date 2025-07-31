'use client';

import { capitalize } from '@/common/utils';
import { Form, Skeleton, Select, Tag, Space } from 'antd';
import { LabeledValue } from 'antd/es/select';

type Props = {
  name: string;
  label?: string;
  warning?: string;
  disabled?: boolean;
  options: LabeledValue[];
  loading?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  multiple?: boolean;
  editing: boolean;
  display: string[];
};

const EditableViewOptionField = (props: Props) => {
  const label = props.label ?? capitalize(props.name);
  return (
    <Form.Item
      label={label}
      name={props.name}
      rules={props.warning ? [{ required: true, message: props.warning }] : undefined}
    >
      {props.loading ? (
        <Skeleton.Input />
      ) : props.editing ? (
        <Select
          options={props.options}
          disabled={props.disabled}
          value={props.value}
          onChange={props.onChange}
          mode={props.multiple ? 'multiple' : undefined}
        />
      ) : (
        <Space>
          {props.display.length > 0 ? (
            props.display.map(item => {
              return (
                <Tag color="blue" key={item}>
                  {item}
                </Tag>
              );
            })
          ) : (
            <Tag color="grey">None</Tag>
          )}
        </Space>
      )}
    </Form.Item>
  );
};

export default EditableViewOptionField;
