'use client';

import { Button, Form, Row, Space } from 'antd';
import { useRouter } from 'next/navigation';

const FormSubmitButton = () => {
  const router = useRouter();
  return (
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
  );
};

export default FormSubmitButton;
