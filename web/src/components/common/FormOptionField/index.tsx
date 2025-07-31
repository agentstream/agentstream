'use client';

import { capitalize } from '@/common/utils';
import { Form, Select } from 'antd';
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
};

const FormOptionField = (props: Props) => {
  const label = props.label ?? capitalize(props.name);
  return (
    <Form.Item
      label={label}
      name={props.name}
      rules={props.warning ? [{ required: true, message: props.warning }] : undefined}
    >
      <Select
        options={props.options}
        loading={props.loading}
        disabled={props.disabled}
        value={props.value}
        onChange={props.onChange}
        mode={props.multiple ? 'multiple' : undefined}
      />
    </Form.Item>
  );
};

export default FormOptionField;
