import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { getEncoding } from 'js-tiktoken';

const encoding = getEncoding('cl100k_base');
const chunkSize = 800;
const chunkOverlap = 100;

export const chunkText = async (text: string): Promise<string[]> => {
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize,
        chunkOverlap,
        lengthFunction: (text) => encoding.encode(text).length,
    });
    return await textSplitter.splitText(text);
}