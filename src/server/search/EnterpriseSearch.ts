export interface SearchQuery {
  term: string;
  entityTypes?: ('candidate' | 'requirement' | 'company' | 'communication')[];
  organizationId: string;
}

export interface SearchResult {
  id: string;
  entityType: string;
  score: number;
  highlight: string;
  metadata: any;
}

export class EnterpriseSearch {
  async search(query: SearchQuery): Promise<SearchResult[]> {
    console.log(`[EnterpriseSearch] Searching for "${query.term}" in org ${query.organizationId}`);
    // In production, delegate to a hybrid search index (keyword + vector)
    return [];
  }
}

export const enterpriseSearch = new EnterpriseSearch();
