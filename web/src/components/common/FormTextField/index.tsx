'use client';

import { capitalize } from '@/common/utils';
import { Form, Input } from 'antd';

type Props = {
  name: string;
  label?: string;
  rows?: number;
  warning?: string;
  placeholder?: string;
};

const FormTextField = (props: Props) => {
  const label = props.label ?? capitalize(props.name);
  return (
    <Form.Item
      label={label}
      name={props.name}
      rules={props.warning ? [{ required: true, message: props.warning }] : undefined}
    >
      {props.rows ? (
        <Input.TextArea rows={props.rows} placeholder={props.placeholder} />
      ) : (
        <Input placeholder={props.placeholder} />
      )}
    </Form.Item>
  );
};

export default FormTextField;
