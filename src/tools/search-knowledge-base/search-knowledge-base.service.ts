import { Injectable } from '@nestjs/common';

@Injectable()
export class SearchKnowledgeBaseService {}
// question
//    ↓
// embedding
//    ↓
// pgvector
//    ↓
// top relevant chunks
