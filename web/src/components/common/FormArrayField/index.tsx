'use client';

import { capitalize } from '@/common/utils';
import { Form, Input, Tag } from 'antd';
import { useState } from 'react';

type Props = {
  name: string;
  label?: string;
  placeholder: string;
  split: string;
  ignore: string;
};

const FormArrayField = (props: Props) => {
  const [value, setValue] = useState('');
  const elements = value.split(props.split).filter(item => item !== props.ignore);
  const label = props.label ?? capitalize(props.name);
  return (
    <>
      <Form.Item label={label} name={props.name}>
        <Input
          placeholder={props.placeholder}
          value={value}
          onChange={event => setValue(event.target.value)}
        />
      </Form.Item>
      {elements.length > 0 && (
        <Form.Item label=" " colon={false}>
          {elements.map(item => (
            <Tag key={item} color="blue">
              {item}
            </Tag>
          ))}
        </Form.Item>
      )}
    </>
  );
};

export default FormArrayField;
