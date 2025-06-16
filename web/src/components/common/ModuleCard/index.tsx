'use client';

import { SerializedYAML } from '@/common/types';
import { Card, Collapse, Space } from 'antd';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { codeBlockInMarkdown } from '@/common/utils';

type Props = {
  name: string;
  description: string;
  sourceSchema: SerializedYAML<unknown>;
  sinkSchema: SerializedYAML<unknown>;
};

const ModuleCard = (props: Props) => {
  return (
    <Card className="w-100">
      <Space direction="vertical">
        <div>
          <b>Name</b>: {props.name}
        </div>
        <div>
          <b>Description</b>: {props.description}
        </div>
        <Collapse
          ghost
          expandIconPosition="end"
          className="[&_.ant-collapse-header]:px-0! [&_.ant-collapse-header]:pt-0!"
          items={[
            {
              key: 'source',
              label: <b>SourceSchema</b>,
              children: <MarkdownPreview source={codeBlockInMarkdown('yaml', props.sourceSchema)} />
            },
            {
              key: 'sink',
              label: <b>SinkSchema</b>,
              children: <MarkdownPreview source={codeBlockInMarkdown('yaml', props.sinkSchema)} />
            }
          ]}
        />
      </Space>
    </Card>
  );
};

export default ModuleCard;
