'use client';

import { Module } from '@/common/enum';

type Props = {
  module: Module;
};

const Metrics = (props: Props) => {
  return <div>{props.module}-metrics</div>;
};

export default Metrics;
