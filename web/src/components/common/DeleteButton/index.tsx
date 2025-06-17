'use client';

import { Module } from '@/common/enum';
import { Popconfirm } from 'antd';
import { PropsWithChildren } from 'react';

type Props = {
  type: Module;
  action: () => void;
};

const DeleteButton = (props: PropsWithChildren<Props>) => {
  return (
    <Popconfirm
      title={`Delete this ${props.type}`}
      description={`Are you sure to delete this ${props.type}?`}
      onConfirm={props.action}
    >
      {props.children}
    </Popconfirm>
  );
};

export default DeleteButton;
