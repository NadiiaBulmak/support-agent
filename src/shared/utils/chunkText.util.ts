import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { chunkSize, chunkOverlap, encoding } from '#/shared/constants/domain.constants.js';

export const chunkText = async (text: string): Promise<string[]> => {
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    lengthFunction: (value) => encoding.encode(value).length,
  });
  return await textSplitter.splitText(text);
};