'use client';

import { Form, Skeleton, Tag } from 'antd';

type Props = {
  label: string;
  value: string;
  loading: boolean;
  error?: boolean;
};
const ViewTextField = (props: Props) => {
  const { label, value, loading } = props;
  return (
    <Form.Item label={label}>
      {loading ? <Skeleton.Input /> : <Tag color={props.error ? 'error' : 'blue'}>{value}</Tag>}
    </Form.Item>
  );
};

export default ViewTextField;
