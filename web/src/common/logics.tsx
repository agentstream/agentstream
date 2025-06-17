import { deleteFunction } from '@/server/logics/function';
import { notification } from 'antd';
import { StatusCodes } from 'http-status-codes';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { codeBlockInMarkdown } from './utils';

const placement = 'top';
export async function deleteFunctionInteraction(name: string, namespace: string) {
  const resp = await deleteFunction(name, namespace);
  if (resp.code === StatusCodes.NO_CONTENT) {
    notification.success({
      message: 'Delete Success!',
      placement
    });
  } else {
    notification.error({
      message: 'Delete failed!',
      description: (
        <MarkdownPreview source={codeBlockInMarkdown('json', JSON.stringify(resp.data, null, 2))} />
      ),
      placement
    });
  }
}
