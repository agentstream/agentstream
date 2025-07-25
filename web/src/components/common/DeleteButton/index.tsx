'use client';

import { Module } from '@/common/enum';
import { Popconfirm } from '@/common/antd';
import { ReactNode } from 'react';

type Props = {
  type: Module;
  action: () => void;
  display: ReactNode;
};

const DeleteButton = (props: Props) => {
  return (
    <Popconfirm
      title={`Delete this ${props.type}`}
      description={`Are you sure to delete this ${props.type}?`}
      onConfirm={props.action}
    >
      {props.display}
    </Popconfirm>
  );
};

export default DeleteButton;
