import { Injectable } from '@angular/core';

/**
 * EMR Sync Service - Handles communication with EMR backend
 */
@Injectable({ providedIn: 'root' })
export class EmrSyncService {
  
  async pushChange(resourceType: string, action: string, payload: any): Promise<boolean> {
    console.log(`[EMR Sync] ${action} ${resourceType}:`, payload);
    await this.simulateApiCall();
    return true;
  }

  async requestRefill(medicationId: string): Promise<{ success: boolean; requestId?: string }> {
    console.log('[EMR Sync] Refill request:', medicationId);
    await this.simulateApiCall();
    return { success: true, requestId: `REF-${Date.now()}` };
  }

  async sendMessage(threadId: string, content: string): Promise<{ success: boolean; messageId?: string }> {
    console.log('[EMR Sync] Send message:', { threadId, content });
    await this.simulateApiCall();
    return { success: true, messageId: `MSG-${Date.now()}` };
  }

  private simulateApiCall(ms = 300): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
