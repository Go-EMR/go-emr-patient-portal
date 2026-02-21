import { Injectable, signal, computed } from '@angular/core';

export type TelehealthState = 'device-check' | 'waiting-room' | 'in-call' | 'post-call';

export interface ChatMessage {
  id: string;
  sender: 'patient' | 'provider';
  senderName: string;
  text: string;
  timestamp: Date;
}

export interface CallSession {
  appointmentId: string;
  providerName: string;
  providerSpecialty: string;
  providerAvatar?: string;
  scheduledTime: string;
  estimatedWait: number;
  callDuration: number;
}

@Injectable({ providedIn: 'root' })
export class TelehealthService {
  private _state = signal<TelehealthState>('device-check');
  private _session = signal<CallSession | null>(null);
  private _cameraOn = signal(true);
  private _micOn = signal(true);
  private _screenSharing = signal(false);
  private _chatOpen = signal(false);
  private _chatMessages = signal<ChatMessage[]>([]);
  private _waitSeconds = signal(0);
  private _callSeconds = signal(0);
  private _cameraPermission = signal<'granted' | 'denied' | 'pending'>('pending');
  private _micPermission = signal<'granted' | 'denied' | 'pending'>('pending');

  private waitTimer: ReturnType<typeof setInterval> | null = null;
  private callTimer: ReturnType<typeof setInterval> | null = null;

  readonly state = this._state.asReadonly();
  readonly session = this._session.asReadonly();
  readonly cameraOn = this._cameraOn.asReadonly();
  readonly micOn = this._micOn.asReadonly();
  readonly screenSharing = this._screenSharing.asReadonly();
  readonly chatOpen = this._chatOpen.asReadonly();
  readonly chatMessages = this._chatMessages.asReadonly();
  readonly waitSeconds = this._waitSeconds.asReadonly();
  readonly callSeconds = this._callSeconds.asReadonly();
  readonly cameraPermission = this._cameraPermission.asReadonly();
  readonly micPermission = this._micPermission.asReadonly();

  readonly callDurationFormatted = computed(() => {
    const s = this._callSeconds();
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  });

  readonly waitTimeFormatted = computed(() => {
    const s = this._waitSeconds();
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  });

  initSession(appointmentId: string): void {
    this._session.set({
      appointmentId,
      providerName: 'Dr. Michael Chen',
      providerSpecialty: 'Cardiology',
      scheduledTime: '2:00 PM',
      estimatedWait: 120,
      callDuration: 0
    });
    this._state.set('device-check');
    this._cameraOn.set(true);
    this._micOn.set(true);
    this._screenSharing.set(false);
    this._chatOpen.set(false);
    this._chatMessages.set([]);
    this._waitSeconds.set(0);
    this._callSeconds.set(0);
    this._cameraPermission.set('pending');
    this._micPermission.set('pending');
  }

  checkDevicePermissions(): void {
    // Simulate permission check
    setTimeout(() => this._cameraPermission.set('granted'), 800);
    setTimeout(() => this._micPermission.set('granted'), 1200);
  }

  joinWaitingRoom(): void {
    this._state.set('waiting-room');
    this._waitSeconds.set(0);
    this.waitTimer = setInterval(() => {
      this._waitSeconds.update(s => s + 1);
    }, 1000);

    // Simulate provider joining after a short wait
    setTimeout(() => {
      this.providerReady();
    }, 8000);
  }

  private providerReady(): void {
    if (this.waitTimer) {
      clearInterval(this.waitTimer);
      this.waitTimer = null;
    }
    this._state.set('in-call');
    this._callSeconds.set(0);
    this.callTimer = setInterval(() => {
      this._callSeconds.update(s => s + 1);
    }, 1000);

    // Simulate provider greeting
    setTimeout(() => {
      this.addProviderMessage('Hello! Thanks for joining. How are you feeling today?');
    }, 2000);
  }

  toggleCamera(): void {
    this._cameraOn.update(v => !v);
  }

  toggleMic(): void {
    this._micOn.update(v => !v);
  }

  toggleScreenShare(): void {
    this._screenSharing.update(v => !v);
  }

  toggleChat(): void {
    this._chatOpen.update(v => !v);
  }

  sendMessage(text: string): void {
    if (!text.trim()) return;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'patient',
      senderName: 'You',
      text: text.trim(),
      timestamp: new Date()
    };
    this._chatMessages.update(msgs => [...msgs, msg]);

    // Simulate provider reply
    setTimeout(() => {
      this.addProviderMessage(this.getAutoReply(text));
    }, 3000);
  }

  private addProviderMessage(text: string): void {
    const session = this._session();
    if (!session || this._state() !== 'in-call') return;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'provider',
      senderName: session.providerName,
      text,
      timestamp: new Date()
    };
    this._chatMessages.update(msgs => [...msgs, msg]);
  }

  private getAutoReply(input: string): string {
    const lower = input.toLowerCase();
    if (lower.includes('good') || lower.includes('fine') || lower.includes('well')) {
      return "That's great to hear! Let me review your recent vitals and lab results while we talk.";
    }
    if (lower.includes('pain') || lower.includes('hurt')) {
      return "I'm sorry to hear that. Can you describe where exactly the pain is and rate it on a scale of 1-10?";
    }
    if (lower.includes('medication') || lower.includes('medicine')) {
      return "Let me pull up your current medication list. Are you experiencing any side effects?";
    }
    return "I understand. Let me make a note of that. Is there anything else you'd like to discuss today?";
  }

  endCall(): void {
    if (this.callTimer) {
      clearInterval(this.callTimer);
      this.callTimer = null;
    }
    if (this.waitTimer) {
      clearInterval(this.waitTimer);
      this.waitTimer = null;
    }
    this._state.set('post-call');
  }

  cleanup(): void {
    if (this.callTimer) clearInterval(this.callTimer);
    if (this.waitTimer) clearInterval(this.waitTimer);
    this.callTimer = null;
    this.waitTimer = null;
  }
}
