import { Injectable, signal, computed } from '@angular/core';

export type CheckerStep = 'select-area' | 'symptoms' | 'severity' | 'details' | 'result';
export type TriageLevel = 'self-care' | 'schedule' | 'urgent-care' | 'emergency';

export interface BodyArea {
  id: string;
  label: string;
  icon: string;
  symptoms: string[];
}

export interface SymptomEntry {
  symptom: string;
  severity: number;
  duration: string;
  notes?: string;
}

export interface TriageResult {
  level: TriageLevel;
  title: string;
  description: string;
  recommendations: string[];
  possibleConditions: string[];
  disclaimer: string;
}

export interface ChatBubble {
  id: string;
  type: 'bot' | 'user' | 'options' | 'severity' | 'result';
  text?: string;
  options?: string[];
  selectedOption?: string;
  severity?: number;
  result?: TriageResult;
  timestamp: Date;
}

const BODY_AREAS: BodyArea[] = [
  { id: 'head', label: 'Head & Neck', icon: 'pi-eye', symptoms: ['Headache', 'Dizziness', 'Sore throat', 'Ear pain', 'Neck stiffness', 'Sinus pressure', 'Blurred vision'] },
  { id: 'chest', label: 'Chest & Heart', icon: 'pi-heart', symptoms: ['Chest pain', 'Shortness of breath', 'Heart palpitations', 'Cough', 'Wheezing', 'Chest tightness'] },
  { id: 'abdomen', label: 'Abdomen & Digestive', icon: 'pi-circle', symptoms: ['Abdominal pain', 'Nausea', 'Vomiting', 'Diarrhea', 'Constipation', 'Bloating', 'Heartburn'] },
  { id: 'limbs', label: 'Arms & Legs', icon: 'pi-arrows-alt', symptoms: ['Joint pain', 'Muscle ache', 'Numbness', 'Swelling', 'Weakness', 'Cramping', 'Limited range of motion'] },
  { id: 'skin', label: 'Skin', icon: 'pi-shield', symptoms: ['Rash', 'Itching', 'Bruising', 'Wound', 'Discoloration', 'Swelling', 'Dry/flaking skin'] },
  { id: 'general', label: 'General / Whole Body', icon: 'pi-user', symptoms: ['Fever', 'Fatigue', 'Chills', 'Weight changes', 'Night sweats', 'Loss of appetite', 'Insomnia'] },
];

@Injectable({ providedIn: 'root' })
export class SymptomCheckerService {
  private _step = signal<CheckerStep>('select-area');
  private _selectedArea = signal<BodyArea | null>(null);
  private _selectedSymptoms = signal<string[]>([]);
  private _severity = signal(5);
  private _duration = signal('');
  private _chatHistory = signal<ChatBubble[]>([]);
  private _isTyping = signal(false);

  readonly step = this._step.asReadonly();
  readonly selectedArea = this._selectedArea.asReadonly();
  readonly selectedSymptoms = this._selectedSymptoms.asReadonly();
  readonly severity = this._severity.asReadonly();
  readonly duration = this._duration.asReadonly();
  readonly chatHistory = this._chatHistory.asReadonly();
  readonly isTyping = this._isTyping.asReadonly();
  readonly bodyAreas = BODY_AREAS;

  readonly availableSymptoms = computed(() => this._selectedArea()?.symptoms || []);

  reset(): void {
    this._step.set('select-area');
    this._selectedArea.set(null);
    this._selectedSymptoms.set([]);
    this._severity.set(5);
    this._duration.set('');
    this._chatHistory.set([]);
    this._isTyping.set(false);

    this.addBotMessage("Hi! I'm your health assistant. I can help you evaluate your symptoms and recommend next steps.");
    setTimeout(() => {
      this.addBotMessage("Let's start by identifying where you're experiencing discomfort. Please select a body area below.");
    }, 800);
  }

  selectArea(area: BodyArea): void {
    this._selectedArea.set(area);
    this.addUserMessage(area.label);
    this._step.set('symptoms');

    this.simulateTyping(() => {
      this.addBotMessage(`Got it — you're having issues with ${area.label.toLowerCase()}. Which symptoms are you experiencing?`);
      this.addBotMessage("Select all that apply, then tap Continue.");
    });
  }

  toggleSymptom(symptom: string): void {
    this._selectedSymptoms.update(list =>
      list.includes(symptom) ? list.filter(s => s !== symptom) : [...list, symptom]
    );
  }

  confirmSymptoms(): void {
    const symptoms = this._selectedSymptoms();
    if (symptoms.length === 0) return;
    this.addUserMessage(symptoms.join(', '));
    this._step.set('severity');

    this.simulateTyping(() => {
      this.addBotMessage(`You reported ${symptoms.length} symptom${symptoms.length > 1 ? 's' : ''}. On a scale of 1-10, how severe would you rate your discomfort overall?`);
    });
  }

  setSeverity(value: number): void {
    this._severity.set(value);
  }

  confirmSeverity(): void {
    const sev = this._severity();
    this.addUserMessage(`Severity: ${sev}/10`);
    this._step.set('details');

    this.simulateTyping(() => {
      this.addBotMessage("How long have you been experiencing these symptoms?");
    });
  }

  selectDuration(duration: string): void {
    this._duration.set(duration);
    this.addUserMessage(duration);
    this._step.set('result');

    this.simulateTyping(() => {
      this.addBotMessage("Thank you for sharing. Let me analyze your symptoms...");
      setTimeout(() => {
        const result = this.generateResult();
        this._chatHistory.update(h => [...h, {
          id: `msg-${Date.now()}`,
          type: 'result',
          result,
          timestamp: new Date()
        }]);
      }, 1500);
    });
  }

  private generateResult(): TriageResult {
    const severity = this._severity();
    const symptoms = this._selectedSymptoms();
    const area = this._selectedArea();

    const hasEmergencySymptom = symptoms.some(s =>
      ['Chest pain', 'Shortness of breath', 'Heart palpitations'].includes(s)
    );

    if (hasEmergencySymptom && severity >= 8) {
      return {
        level: 'emergency',
        title: 'Seek Emergency Care',
        description: 'Based on your symptoms and severity, you should seek immediate medical attention.',
        recommendations: [
          'Call 911 or go to the nearest emergency room',
          'Do not drive yourself if experiencing severe chest pain',
          'Take aspirin if not allergic (for chest pain symptoms)',
          'Stay calm and try to rest while waiting for help'
        ],
        possibleConditions: ['Cardiac event', 'Pulmonary embolism', 'Severe anxiety/panic attack'],
        disclaimer: 'This is not a medical diagnosis. When in doubt, always err on the side of seeking emergency care.'
      };
    }

    if (severity >= 7 || hasEmergencySymptom) {
      return {
        level: 'urgent-care',
        title: 'Visit Urgent Care',
        description: 'Your symptoms suggest you should be seen by a healthcare provider soon.',
        recommendations: [
          'Visit an urgent care center today',
          'Bring a list of your current medications',
          'Note when symptoms started and any triggers',
          'If symptoms worsen, go to the emergency room'
        ],
        possibleConditions: this.getPossibleConditions(area?.id || '', symptoms, 'urgent'),
        disclaimer: 'This is an automated assessment and not a substitute for professional medical advice.'
      };
    }

    if (severity >= 4) {
      return {
        level: 'schedule',
        title: 'Schedule an Appointment',
        description: 'Your symptoms are moderate and would benefit from a medical evaluation.',
        recommendations: [
          'Schedule an appointment within the next few days',
          'Keep track of symptom changes',
          'Rest and stay hydrated',
          'Use over-the-counter remedies as appropriate'
        ],
        possibleConditions: this.getPossibleConditions(area?.id || '', symptoms, 'moderate'),
        disclaimer: 'This is an automated assessment and not a substitute for professional medical advice.'
      };
    }

    return {
      level: 'self-care',
      title: 'Self-Care Recommended',
      description: 'Your symptoms appear mild and may improve with self-care.',
      recommendations: [
        'Rest and stay hydrated',
        'Monitor your symptoms over the next 48 hours',
        'Use over-the-counter medications as needed',
        'Schedule a visit if symptoms persist or worsen'
      ],
      possibleConditions: this.getPossibleConditions(area?.id || '', symptoms, 'mild'),
      disclaimer: 'This is an automated assessment and not a substitute for professional medical advice.'
    };
  }

  private getPossibleConditions(area: string, symptoms: string[], severity: string): string[] {
    const conditionMap: Record<string, string[]> = {
      head: ['Tension headache', 'Migraine', 'Sinusitis', 'Upper respiratory infection'],
      chest: ['Bronchitis', 'Asthma exacerbation', 'Costochondritis', 'Anxiety'],
      abdomen: ['Gastritis', 'Food intolerance', 'IBS flare-up', 'Viral gastroenteritis'],
      limbs: ['Muscle strain', 'Tendinitis', 'Arthritis flare', 'Overuse injury'],
      skin: ['Contact dermatitis', 'Eczema', 'Allergic reaction', 'Minor infection'],
      general: ['Viral infection', 'Stress response', 'Seasonal illness', 'Dehydration']
    };
    return conditionMap[area] || ['General malaise', 'Viral syndrome'];
  }

  private addBotMessage(text: string): void {
    this._chatHistory.update(h => [...h, {
      id: `msg-${Date.now()}-${Math.random()}`,
      type: 'bot',
      text,
      timestamp: new Date()
    }]);
  }

  private addUserMessage(text: string): void {
    this._chatHistory.update(h => [...h, {
      id: `msg-${Date.now()}-${Math.random()}`,
      type: 'user',
      text,
      timestamp: new Date()
    }]);
  }

  private simulateTyping(callback: () => void): void {
    this._isTyping.set(true);
    setTimeout(() => {
      this._isTyping.set(false);
      callback();
    }, 1200);
  }
}
