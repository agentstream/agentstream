'use client';

import { capitalize } from '@/common/utils';
import { Form, Input, Skeleton, Space, Tag } from 'antd';
import { useEffect, useState } from 'react';

type Props = {
  name: string;
  label?: string;
  loading: boolean;
  editing: boolean;
  placeholder?: string;
  split: string;
  ignore: string;
  display: string[];
};

const EditableViewArrayField = (props: Props) => {
  const [value, setValue] = useState('');
  useEffect(() => {
    if (!props.editing) {
      setValue(props.display.join(props.split));
    }
  }, [props.editing, props.display, props.split]);
  const elements = value.split(props.split).filter(item => item !== props.ignore);
  const label = props.label ?? capitalize(props.name);
  return (
    <>
      <Form.Item label={label} name={props.name}>
        {props.loading ? (
          <Skeleton.Input />
        ) : props.editing ? (
          <Input
            placeholder={props.placeholder}
            value={value}
            onChange={event => setValue(event.target.value)}
          />
        ) : (
          <Space>
            {props.display.map(item => {
              return (
                <Tag color="blue" key={item}>
                  {item}
                </Tag>
              );
            })}
          </Space>
        )}
      </Form.Item>
      {props.editing && elements.length > 0 && (
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

export default EditableViewArrayField;
