import { Injectable, signal, computed } from '@angular/core';
import { CarePlan, CarePlanActivity } from '../../shared/data-access/models';

@Injectable({ providedIn: 'root' })
export class CarePlansService {
  private _plans = signal<CarePlan[]>([]);
  private _loading = signal(false);

  readonly plans = this._plans.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly activePlans = computed(() =>
    this._plans().filter(p => p.status === 'active')
  );

  readonly completedPlans = computed(() =>
    this._plans().filter(p => p.status === 'completed' || p.status === 'on-hold')
  );

  constructor() {
    this.loadMockData();
  }

  toggleActivity(planId: string, activityId: string): void {
    this._plans.update(plans =>
      plans.map(plan => {
        if (plan.id !== planId) return plan;
        const activities = plan.activities.map(a =>
          a.id === activityId ? { ...a, completed: !a.completed } : a
        );
        const completedCount = activities.filter(a => a.completed).length;
        const progress = Math.round((completedCount / activities.length) * 100);
        return { ...plan, activities, overallProgress: Math.max(plan.overallProgress, progress) };
      })
    );
  }

  private loadMockData(): void {
    this._loading.set(true);
    setTimeout(() => {
      const now = new Date();
      const monthsAgo = (n: number) => {
        const d = new Date(now);
        d.setMonth(d.getMonth() - n);
        return d;
      };
      const monthsFromNow = (n: number) => {
        const d = new Date(now);
        d.setMonth(d.getMonth() + n);
        return d;
      };
      const weeksAgo = (n: number) => {
        const d = new Date(now);
        d.setDate(d.getDate() - n * 7);
        return d;
      };

      const plans: CarePlan[] = [
        {
          id: 'cp-001',
          title: 'Diabetes Management Plan',
          description: 'Comprehensive plan to achieve and maintain optimal blood glucose control, reduce HbA1c to below 7%, and prevent long-term diabetic complications through medication, lifestyle modification, and self-monitoring.',
          managingProvider: 'Dr. Sarah Chen',
          careTeamMembers: ['Dr. Sarah Chen (Internal Medicine)', 'Alice Johnson, RD (Dietitian)', 'Mark Torres, CDE (Diabetes Educator)', 'GoHealth Pharmacy'],
          startDate: monthsAgo(6),
          nextReviewDate: monthsFromNow(1),
          status: 'active',
          priority: 'routine',
          overallProgress: 65,
          category: 'Chronic Disease Management',
          goals: [
            {
              id: 'g-001-1',
              description: 'Achieve HbA1c below 7.0%',
              targetDate: monthsFromNow(3),
              progress: 70,
              status: 'on-track',
              milestonesAchieved: ['Established baseline HbA1c (7.4%)', 'Completed diabetes education program', 'Adjusted Metformin dosage']
            },
            {
              id: 'g-001-2',
              description: 'Perform daily blood glucose monitoring and log readings',
              targetDate: monthsFromNow(1),
              progress: 80,
              status: 'on-track',
              milestonesAchieved: ['Obtained glucose meter', 'Established morning check routine', 'Logging in patient portal consistently']
            },
            {
              id: 'g-001-3',
              description: 'Achieve and maintain healthy weight (target: 175 lbs)',
              targetDate: monthsFromNow(6),
              progress: 35,
              status: 'at-risk',
              milestonesAchieved: ['Completed dietitian consultation', 'Started food journaling']
            }
          ],
          activities: [
            {
              id: 'a-001-1',
              description: 'Check blood glucose level before breakfast',
              category: 'monitoring',
              frequency: 'Daily (morning)',
              completed: true,
              notes: 'Target: 80-130 mg/dL fasting'
            },
            {
              id: 'a-001-2',
              description: 'Check blood glucose level 2 hours after dinner',
              category: 'monitoring',
              frequency: 'Daily (evening)',
              completed: true,
              notes: 'Target: below 180 mg/dL post-meal'
            },
            {
              id: 'a-001-3',
              description: 'Take Metformin 1000mg with breakfast',
              category: 'medication',
              frequency: 'Daily',
              completed: true
            },
            {
              id: 'a-001-4',
              description: 'Take Metformin 1000mg with dinner',
              category: 'medication',
              frequency: 'Daily',
              completed: false
            },
            {
              id: 'a-001-5',
              description: '30-minute brisk walk or moderate aerobic exercise',
              category: 'exercise',
              frequency: '5 days per week',
              completed: false,
              notes: 'Can split into 2 x 15-min sessions'
            },
            {
              id: 'a-001-6',
              description: 'Follow low-glycemic diet plan — limit refined carbs and sugary foods',
              category: 'diet',
              frequency: 'Daily',
              completed: true,
              notes: 'See meal plan from dietitian in Documents section'
            },
            {
              id: 'a-001-7',
              description: 'HbA1c lab draw',
              category: 'appointment',
              frequency: 'Every 3 months',
              completed: false
            }
          ],
          providerNotes: 'Patient is making good progress on glucose monitoring and medication adherence. Weight loss goal needs more attention — encouraged to schedule follow-up with dietitian. Overall trajectory is positive. Next HbA1c should show improvement if current habits are maintained.'
        },
        {
          id: 'cp-002',
          title: 'Post-Cardiac Procedure Recovery',
          description: 'Structured rehabilitation and recovery plan following cardiac catheterization. Goals include restoring full physical function, managing symptoms, optimizing medication regimen, and preventing complications.',
          managingProvider: 'Dr. Michael Park',
          careTeamMembers: ['Dr. Michael Park (Cardiology)', 'Sandra Lee, PT (Physical Therapist)', 'Cardiac Rehab Team — Seattle Heart Center', 'Dr. Sarah Chen (Primary Care)'],
          startDate: weeksAgo(6),
          nextReviewDate: monthsFromNow(2),
          status: 'active',
          priority: 'urgent',
          overallProgress: 40,
          category: 'Post-Procedure Recovery',
          goals: [
            {
              id: 'g-002-1',
              description: 'Regain full range of motion and endurance to pre-procedure level',
              targetDate: monthsFromNow(2),
              progress: 45,
              status: 'on-track',
              milestonesAchieved: ['Cleared for light activity at 2-week check', 'Completed 4 cardiac rehab sessions']
            },
            {
              id: 'g-002-2',
              description: 'Achieve blood pressure consistently below 130/80 mmHg',
              targetDate: monthsFromNow(1),
              progress: 60,
              status: 'on-track',
              milestonesAchieved: ['Optimized Lisinopril dose', 'Sodium intake reduced significantly']
            },
            {
              id: 'g-002-3',
              description: 'Complete all wound healing without infection or complications',
              targetDate: weeksAgo(-4),
              progress: 30,
              status: 'at-risk',
              milestonesAchieved: ['Initial wound assessment normal']
            }
          ],
          activities: [
            {
              id: 'a-002-1',
              description: 'Attend cardiac rehabilitation session',
              category: 'appointment',
              frequency: '3 times per week',
              completed: false
            },
            {
              id: 'a-002-2',
              description: 'Daily wound site inspection — check for redness, swelling, discharge',
              category: 'monitoring',
              frequency: 'Daily',
              completed: true,
              notes: 'Call the office immediately if wound shows signs of infection'
            },
            {
              id: 'a-002-3',
              description: 'Take Atorvastatin 40mg at bedtime',
              category: 'medication',
              frequency: 'Nightly',
              completed: true
            },
            {
              id: 'a-002-4',
              description: 'Take Lisinopril 10mg each morning',
              category: 'medication',
              frequency: 'Daily',
              completed: false
            },
            {
              id: 'a-002-5',
              description: 'Short walk: 10-15 minutes at comfortable pace',
              category: 'exercise',
              frequency: 'Daily',
              completed: true,
              notes: 'Increase duration by 5 min each week as tolerated. Stop if chest pain or shortness of breath.'
            },
            {
              id: 'a-002-6',
              description: 'Low-sodium diet — target less than 1500mg sodium per day',
              category: 'diet',
              frequency: 'Daily',
              completed: false
            },
            {
              id: 'a-002-7',
              description: 'Record daily blood pressure readings morning and evening',
              category: 'monitoring',
              frequency: 'Twice daily',
              completed: true,
              notes: 'Log readings in the patient portal. Call if systolic > 160 or < 90.'
            }
          ],
          providerNotes: 'Patient is progressing well overall. Cardiac rehab attendance has been good. Important to maintain medication adherence especially with Atorvastatin and Lisinopril. Physical therapy team reports good effort. No complications observed at last review. Wound healing is progressing normally — continue monitoring closely.'
        },
        {
          id: 'cp-003',
          title: 'Hypertension Control Program',
          description: 'Completed blood pressure management program. Successfully achieved target blood pressure consistently below 130/80 mmHg through a combination of lifestyle modification and optimized medication therapy.',
          managingProvider: 'Dr. Sarah Chen',
          careTeamMembers: ['Dr. Sarah Chen (Internal Medicine)', 'GoHealth Pharmacy'],
          startDate: monthsAgo(12),
          endDate: monthsAgo(1),
          nextReviewDate: undefined,
          status: 'completed',
          priority: 'routine',
          overallProgress: 100,
          category: 'Chronic Disease Management',
          goals: [
            {
              id: 'g-003-1',
              description: 'Achieve consistent blood pressure below 130/80 mmHg',
              targetDate: monthsAgo(3),
              progress: 100,
              status: 'completed',
              milestonesAchieved: ['Average BP reduced from 148/92 to 124/78', 'Target achieved and maintained for 3 consecutive months', 'Lifestyle changes sustained']
            },
            {
              id: 'g-003-2',
              description: 'Reduce daily sodium intake to under 2000mg',
              targetDate: monthsAgo(6),
              progress: 100,
              status: 'completed',
              milestonesAchieved: ['Completed nutrition counseling', 'Food diary showed average 1,650mg sodium/day', 'Cooking habits changed']
            },
            {
              id: 'g-003-3',
              description: '100% medication adherence with Lisinopril',
              targetDate: monthsAgo(1),
              progress: 100,
              status: 'completed',
              milestonesAchieved: ['Established pill reminder routine', 'No missed doses reported over 6 months', 'Refills consistently on time']
            }
          ],
          activities: [
            {
              id: 'a-003-1',
              description: 'Daily blood pressure monitoring',
              category: 'monitoring',
              frequency: 'Daily (morning)',
              completed: true
            },
            {
              id: 'a-003-2',
              description: 'Take Lisinopril 10mg each morning',
              category: 'medication',
              frequency: 'Daily',
              completed: true
            },
            {
              id: 'a-003-3',
              description: 'DASH diet adherence',
              category: 'diet',
              frequency: 'Daily',
              completed: true
            },
            {
              id: 'a-003-4',
              description: '30-minute aerobic exercise',
              category: 'exercise',
              frequency: '5 days per week',
              completed: true
            }
          ],
          providerNotes: 'Excellent outcome. Patient demonstrated strong commitment to lifestyle changes and medication adherence. Blood pressure now consistently well-controlled. Transitioning to routine annual monitoring. Continue current medication and lifestyle habits.'
        }
      ];

      this._plans.set(plans);
      this._loading.set(false);
    }, 500);
  }
}
