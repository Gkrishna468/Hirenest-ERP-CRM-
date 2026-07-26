import { getAdminDb } from '../utils/firebaseAdmin';
import { AIMemory } from './schema';
import * as crypto from 'crypto';

export class AIMemoryService {
  private db = getAdminDb();

  async getMemory(entityId: string): Promise<AIMemory | null> {
    const doc = await this.db.collection('ai_memories').doc(entityId).get();
    if (!doc.exists) return null;
    return doc.data() as AIMemory;
  }

  async updateMemory(entityId: string, updates: Partial<AIMemory>): Promise<AIMemory> {
    const docRef = this.db.collection('ai_memories').doc(entityId);
    
    return await this.db.runTransaction(async (t) => {
      const doc = await t.get(docRef);
      const timestamp = new Date().toISOString();
      
      if (!doc.exists) {
        const newMemory: AIMemory = {
          id: entityId,
          entityId,
          entityType: updates.entityType || 'person',
          decisionMakers: updates.decisionMakers || [],
          hiringPattern: updates.hiringPattern || 'Unknown',
          preferredSkills: updates.preferredSkills || [],
          rateCards: updates.rateCards || 'Unknown',
          communicationStyle: updates.communicationStyle || 'Unknown',
          riskScore: updates.riskScore || 0,
          relationshipScore: updates.relationshipScore || 50,
          lastUpdated: timestamp,
          ...updates
        };
        t.set(docRef, newMemory);
        return newMemory;
      } else {
        const existing = doc.data() as AIMemory;
        
        // Merge arrays (skills, decision makers)
        const decisionMakers = [...new Set([...(existing.decisionMakers || []), ...(updates.decisionMakers || [])])];
        const preferredSkills = [...new Set([...(existing.preferredSkills || []), ...(updates.preferredSkills || [])])];
        
        const merged: Partial<AIMemory> = {
          ...updates,
          decisionMakers,
          preferredSkills,
          lastUpdated: timestamp
        };
        
        t.update(docRef, merged);
        return { ...existing, ...merged } as AIMemory;
      }
    });
  }

  /**
   * Called by the Agent Runtime when a conversation progresses.
   */
  async extractAndStoreMemoryFromMessage(message: any, aiAnalysis: any) {
    if (!aiAnalysis || !aiAnalysis.entities) return;
    
    // In a real implementation, the Intent Engine extracts structured entities
    // and we map them to the memory model here.
    
    // For now, we simulate an update based on standard fields
    if (message.sender && message.sender.id) {
      await this.updateMemory(message.sender.id, {
        communicationStyle: aiAnalysis.sentiment || 'Neutral',
        lastOpportunity: new Date().toISOString(),
      });
    }
  }
}

export const aiMemoryService = new AIMemoryService();
