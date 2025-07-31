'use client';

import { Button, Form, Row, Space } from 'antd';

type Props = {
  editing: boolean;
  handleCancel: () => void;
  handleSubmit: () => void;
};

const ViewSubmitButton = (props: Props) => {
  return (
    <Form.Item label={null}>
      <Row justify="end">
        <Space>
          {props.editing ? <Button onClick={props.handleCancel}>Cancel</Button> : null}
          <Button type="primary" onClick={props.handleSubmit}>
            {props.editing ? 'Save' : 'Edit'}
          </Button>
        </Space>
      </Row>
    </Form.Item>
  );
};

export default ViewSubmitButton;
