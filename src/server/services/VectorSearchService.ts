import { Pinecone } from '@pinecone-database/pinecone';

export class VectorSearchService {
  private pinecone: Pinecone | null = null;
  private indexName = process.env.PINECONE_INDEX || 'hirenest-talent-pool';

  constructor() {
    if (process.env.PINECONE_API_KEY) {
      this.pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
      });
    } else {
      console.warn("[VectorSearchService] PINECONE_API_KEY not found. Vector searches will fall back to exact match or basic text overlap.");
    }
  }

  /**
   * Generates embeddings (e.g. using text-embedding-ada-002 or Gemini embeddings) 
   * and upserts the candidate resume data into the Vector DB.
   */
  async upsertCandidate(candidateId: string, parsedResumeText: string, metadata: any) {
    if (!this.pinecone) return;
    try {
      // 1. Generate Embedding
      // const embedding = await aiService.generateEmbedding(parsedResumeText);
      const mockEmbedding = new Array(1536).fill(0.1); 

      // 2. Upsert to Pinecone
      const index = this.pinecone.Index(this.indexName);
      await (index as any).upsert([{
        id: candidateId,
        values: mockEmbedding,
        metadata: {
          vendorId: metadata.vendorId,
          skills: metadata.skills || [],
          experience: metadata.experience || 0,
        }
      }]);
      console.log(`[VectorSearchService] Candidate ${candidateId} upserted to Vector DB`);
    } catch (error) {
      console.error("[VectorSearchService] Error upserting candidate to Vector DB", error);
    }
  }

  /**
   * Embeds the Job Description and performs a cosine-similarity/nearest-neighbor search
   * to quickly retrieve the top K matching candidates without blowing up the LLM token limit.
   */
  async findTopMatches(jobDescription: string, topK: number = 50, filter?: any) {
    if (!this.pinecone) {
      // Fallback: return empty, letting the system fall back to basic matching
      return [];
    }

    try {
      // 1. Generate Embedding for JD
      // const jdEmbedding = await aiService.generateEmbedding(jobDescription);
      const mockJDEmbedding = new Array(1536).fill(0.1);

      // 2. Query Vector DB
      const index = this.pinecone.Index(this.indexName);
      const queryResponse = await index.query({
        vector: mockJDEmbedding,
        topK,
        includeMetadata: true,
        filter,
      });

      return queryResponse.matches || [];
    } catch (error) {
      console.error("[VectorSearchService] Error querying Vector DB", error);
      return [];
    }
  }
}

export const vectorSearchService = new VectorSearchService();
