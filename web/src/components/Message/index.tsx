'use client';

import { Module } from '@/common/enum';

type Props = {
  module: Module;
};

const Message = (props: Props) => {
  return <div>{props.module}-message</div>;
};

export default Message;
