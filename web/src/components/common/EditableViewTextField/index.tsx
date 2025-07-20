'use client';

import { capitalize } from '@/common/utils';
import { Form, Input, Skeleton, Tag } from 'antd';

type Props = {
  name: string;
  label?: string;
  rows?: number;
  warning?: string;
  placeholder?: string;
  loading: boolean;
  editing: boolean;
  display: string;
};

const EditableViewTextField = (props: Props) => {
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
        props.rows ? (
          <Input.TextArea rows={props.rows} placeholder={props.placeholder} />
        ) : (
          <Input placeholder={props.placeholder} />
        )
      ) : (
        <Tag color="blue">{props.display}</Tag>
      )}
    </Form.Item>
  );
};

export default EditableViewTextField;
