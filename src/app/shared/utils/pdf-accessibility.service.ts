import { Injectable, signal, computed } from '@angular/core';

export interface AccessiblePdfResult {
  originalName: string;
  taggedName: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  tags: string[]; // e.g., 'headings', 'lists', 'tables', 'alt-text', 'reading-order'
  wcagLevel: 'A' | 'AA' | 'AAA';
  fileSize: string;
}

export interface PdfDocument {
  id: string;
  name: string;
  fileSize: string;
  isTagged: boolean;
  wcagLevel?: 'A' | 'AA' | 'AAA';
  appliedTags?: string[];
  conversionStatus: 'idle' | 'processing' | 'complete' | 'error';
  conversionProgress: number;
}

@Injectable({ providedIn: 'root' })
export class PdfAccessibilityService {
  private readonly _documents = signal<PdfDocument[]>([
    {
      id: 'pdf-001',
      name: 'Lab Results - February 2026.pdf',
      fileSize: '1.2 MB',
      isTagged: false,
      conversionStatus: 'idle',
      conversionProgress: 0
    },
    {
      id: 'pdf-002',
      name: 'Discharge Summary - January 2026.pdf',
      fileSize: '0.8 MB',
      isTagged: true,
      wcagLevel: 'AA',
      appliedTags: ['headings', 'lists', 'alt-text', 'reading-order'],
      conversionStatus: 'complete',
      conversionProgress: 100
    },
    {
      id: 'pdf-003',
      name: 'Medication List.pdf',
      fileSize: '0.4 MB',
      isTagged: false,
      conversionStatus: 'idle',
      conversionProgress: 0
    },
    {
      id: 'pdf-004',
      name: 'Insurance Card.pdf',
      fileSize: '0.2 MB',
      isTagged: true,
      wcagLevel: 'AA',
      appliedTags: ['headings', 'alt-text', 'reading-order'],
      conversionStatus: 'complete',
      conversionProgress: 100
    }
  ]);

  readonly documents = this._documents.asReadonly();

  readonly untaggedCount = computed(() =>
    this._documents().filter(d => !d.isTagged).length
  );

  readonly taggedCount = computed(() =>
    this._documents().filter(d => d.isTagged).length
  );

  readonly isAnyProcessing = computed(() =>
    this._documents().some(d => d.conversionStatus === 'processing')
  );

  convertDocument(id: string): void {
    this._updateDocument(id, { conversionStatus: 'processing', conversionProgress: 0 });

    const progressSteps = [15, 30, 50, 65, 80, 90, 100];
    let stepIndex = 0;

    const advance = (): void => {
      if (stepIndex < progressSteps.length) {
        const progress = progressSteps[stepIndex];
        this._updateDocument(id, { conversionProgress: progress });
        stepIndex++;
        setTimeout(advance, 200);
      } else {
        const allTags = ['headings', 'lists', 'tables', 'alt-text', 'reading-order'];
        this._updateDocument(id, {
          conversionStatus: 'complete',
          conversionProgress: 100,
          isTagged: true,
          wcagLevel: 'AA',
          appliedTags: allTags
        });
      }
    };

    setTimeout(advance, 200);
  }

  convertAll(): void {
    const untagged = this._documents().filter(d => !d.isTagged && d.conversionStatus === 'idle');
    untagged.forEach((doc, index) => {
      setTimeout(() => this.convertDocument(doc.id), index * 400);
    });
  }

  private _updateDocument(id: string, changes: Partial<PdfDocument>): void {
    this._documents.update(docs =>
      docs.map(d => d.id === id ? { ...d, ...changes } : d)
    );
  }
}
