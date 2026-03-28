import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { TelehealthService } from '../data-access';
import { AuthService } from '../../auth/data-access/auth.service';

@Component({
  selector: 'app-telehealth',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, CardModule, TooltipModule, SelectModule],
  template: `
    <div class="telehealth-page">
      <!-- ==================== DEVICE CHECK ==================== -->
      @if (telehealth.state() === 'device-check') {
        <div class="device-check">
          <div class="check-card">
            <div class="check-header">
              <div class="check-icon"><i class="pi pi-video"></i></div>
              <h1>Pre-Call Setup</h1>
              <p>Let's make sure your devices are ready for the visit</p>
            </div>

            <div class="appointment-info-bar">
              <div class="provider-preview">
                <div class="provider-avatar"><span>MC</span></div>
                <div>
                  <strong>{{ telehealth.session()?.providerName }}</strong>
                  <span>{{ telehealth.session()?.providerSpecialty }}</span>
                </div>
              </div>
              <div class="time-preview">
                <i class="pi pi-clock"></i>
                <span>{{ telehealth.session()?.scheduledTime }}</span>
              </div>
            </div>

            <div class="preview-container">
              <div class="camera-preview" [class.camera-off]="!telehealth.cameraOn()">
                @if (telehealth.cameraOn()) {
                  <div class="camera-simulation">
                    <div class="camera-feed-pattern"></div>
                    <div class="self-label">
                      <i class="pi pi-user"></i>
                      <span>Your camera preview</span>
                    </div>
                  </div>
                } @else {
                  <div class="camera-off-state">
                    <i class="pi pi-video-off"></i>
                    <span>Camera is off</span>
                  </div>
                }
              </div>
              <div class="preview-controls">
                <button class="device-toggle" [class.active]="telehealth.cameraOn()" (click)="telehealth.toggleCamera()"
                        pTooltip="Toggle camera">
                  <i [class]="telehealth.cameraOn() ? 'pi pi-video' : 'pi pi-video-off'"></i>
                </button>
                <button class="device-toggle" [class.active]="telehealth.micOn()" (click)="telehealth.toggleMic()"
                        pTooltip="Toggle microphone">
                  <i [class]="telehealth.micOn() ? 'pi pi-microphone' : 'pi pi-microphone-slash'"></i>
                </button>
              </div>
            </div>

            <div class="device-status-list">
              <div class="device-item">
                <i class="pi pi-video" [class.granted]="telehealth.cameraPermission() === 'granted'"
                   [class.denied]="telehealth.cameraPermission() === 'denied'"
                   [class.pending]="telehealth.cameraPermission() === 'pending'"></i>
                <span>Camera</span>
                <span class="status-tag" [class]="telehealth.cameraPermission()">
                  @switch (telehealth.cameraPermission()) {
                    @case ('granted') { Ready }
                    @case ('denied') { Blocked }
                    @case ('pending') { Checking... }
                  }
                </span>
              </div>
              <div class="device-item">
                <i class="pi pi-microphone" [class.granted]="telehealth.micPermission() === 'granted'"
                   [class.denied]="telehealth.micPermission() === 'denied'"
                   [class.pending]="telehealth.micPermission() === 'pending'"></i>
                <span>Microphone</span>
                <span class="status-tag" [class]="telehealth.micPermission()">
                  @switch (telehealth.micPermission()) {
                    @case ('granted') { Ready }
                    @case ('denied') { Blocked }
                    @case ('pending') { Checking... }
                  }
                </span>
              </div>
              <div class="device-item">
                <i class="pi pi-wifi granted"></i>
                <span>Connection</span>
                <span class="status-tag granted">Strong</span>
              </div>
            </div>

            <div class="check-actions">
              <button pButton label="Back to Appointments" icon="pi pi-arrow-left" class="p-button-text"
                      (click)="goBack()"></button>
              <button pButton label="Join Waiting Room" icon="pi pi-sign-in" class="join-btn"
                      [disabled]="telehealth.cameraPermission() !== 'granted' || telehealth.micPermission() !== 'granted'"
                      (click)="joinWaitingRoomWithCountdown()"></button>
            </div>
          </div>
        </div>
      }

      <!-- ==================== WAITING ROOM ==================== -->
      @if (telehealth.state() === 'waiting-room') {
        <div class="waiting-room">
          <div class="waiting-card">
            <div class="waiting-visual">
              <div class="pulse-ring">
                <div class="pulse-ring-inner"></div>
                <div class="pulse-ring-outer"></div>
                <div class="pulse-center">
                  <i class="pi pi-clock"></i>
                </div>
              </div>
            </div>
            <h1>You're in the Waiting Room</h1>
            <p class="waiting-subtitle">Your provider will be with you shortly</p>

            <div class="waiting-details">
              <div class="detail-row">
                <i class="pi pi-user"></i>
                <span>{{ telehealth.session()?.providerName }} - {{ telehealth.session()?.providerSpecialty }}</span>
              </div>
              <div class="detail-row">
                <i class="pi pi-stopwatch"></i>
                <span>Time waiting: <strong>{{ telehealth.waitTimeFormatted() }}</strong></span>
              </div>
            </div>

            <!-- Feature 9.3: Estimated Wait Countdown -->
            <div class="estimated-wait-section">
              <div class="wait-countdown">
                <i class="pi pi-hourglass"></i>
                <div class="wait-countdown-text">
                  <span class="wait-label">Estimated wait time</span>
                  @if (waitCountdownSeconds() > 0) {
                    <strong class="wait-time">{{ formatCountdown(waitCountdownSeconds()) }}</strong>
                  } @else {
                    <strong class="wait-time ready">Your provider is almost ready!</strong>
                  }
                </div>
              </div>
            </div>

            <!-- Feature 9.3: Connection Test -->
            <div class="connection-test-section">
              <div class="connection-test-row">
                <div class="connection-label">
                  <i class="pi pi-wifi"></i>
                  <span>Connection Quality</span>
                </div>
                @if (connectionTestStatus() === 'idle') {
                  <button pButton label="Test Connection" icon="pi pi-refresh"
                          class="p-button-outlined p-button-sm"
                          (click)="runConnectionTest()"></button>
                } @else if (connectionTestStatus() === 'testing') {
                  <span class="conn-testing"><i class="pi pi-spin pi-spinner"></i> Checking...</span>
                } @else if (connectionTestStatus() === 'done') {
                  <span class="conn-result"><i class="pi pi-check-circle"></i> Connection: Excellent (42ms latency)</span>
                }
              </div>
            </div>

            <!-- Feature 9.3: Preparation Checklist -->
            <div class="prep-checklist">
              <h3><i class="pi pi-list-check"></i> Preparation Checklist</h3>
              <div class="checklist-items">
                @for (item of prepChecklist(); track item.id) {
                  <div class="checklist-item" [class.checked]="item.done" (click)="toggleChecklist(item.id)">
                    <div class="checklist-checkbox">
                      @if (item.done) {
                        <i class="pi pi-check"></i>
                      }
                    </div>
                    <span>{{ item.label }}</span>
                  </div>
                }
              </div>
            </div>

            <div class="waiting-controls">
              <button class="device-toggle" [class.active]="telehealth.cameraOn()" (click)="telehealth.toggleCamera()"
                      pTooltip="Toggle camera">
                <i [class]="telehealth.cameraOn() ? 'pi pi-video' : 'pi pi-video-off'"></i>
              </button>
              <button class="device-toggle" [class.active]="telehealth.micOn()" (click)="telehealth.toggleMic()"
                      pTooltip="Toggle microphone">
                <i [class]="telehealth.micOn() ? 'pi pi-microphone' : 'pi pi-microphone-slash'"></i>
              </button>
            </div>

            <button pButton label="Leave Waiting Room" icon="pi pi-sign-out" class="p-button-outlined p-button-danger leave-btn"
                    (click)="goBack()"></button>
          </div>
        </div>
      }

      <!-- ==================== IN CALL ==================== -->
      @if (telehealth.state() === 'in-call') {
        <div class="in-call" [class.chat-open]="telehealth.chatOpen()">
          <div class="video-area">
            <!-- Provider video (main) / Feature 9.4: Screen Share View -->
            <div class="provider-video">
              @if (telehealth.screenSharing()) {
                <!-- Feature 9.4: Mock shared screen area -->
                <div class="screen-share-view">
                  <div class="browser-mockup">
                    <div class="browser-chrome">
                      <div class="browser-dots">
                        <span class="dot red"></span>
                        <span class="dot yellow"></span>
                        <span class="dot green"></span>
                      </div>
                      <div class="browser-url-bar">
                        <i class="pi pi-lock" style="font-size:0.65rem;color:var(--green-400);"></i>
                        <span>patient-portal.gohealth.com/health-records</span>
                      </div>
                      <!-- Feature 9.4: Share specific tab dropdown -->
                      <div class="share-tab-selector">
                        <p-select
                          [options]="shareTabOptions"
                          [(ngModel)]="selectedShareTab"
                          [style]="{maxWidth:'220px'}"
                          styleClass="share-tab-dropdown">
                        </p-select>
                      </div>
                    </div>
                    <div class="browser-content">
                      <div class="mock-page-header"></div>
                      <div class="mock-page-row"></div>
                      <div class="mock-page-row short"></div>
                      <div class="mock-page-grid">
                        <div class="mock-card"></div>
                        <div class="mock-card"></div>
                        <div class="mock-card"></div>
                      </div>
                    </div>
                  </div>
                  <div class="screen-share-label">
                    <i class="pi pi-desktop"></i>
                    <span>Sharing: {{ selectedShareTab }}</span>
                  </div>
                </div>
              } @else {
                <div class="video-simulation provider-feed">
                  <div class="simulated-person">
                    <div class="person-head"></div>
                    <div class="person-body"></div>
                  </div>
                  <div class="provider-name-overlay">
                    <span>{{ telehealth.session()?.providerName }}</span>
                    <span class="specialty-tag">{{ telehealth.session()?.providerSpecialty }}</span>
                  </div>
                </div>
              }

              <!-- Self view (picture-in-picture) -->
              <div class="self-video" [class.camera-off]="!telehealth.cameraOn()">
                @if (telehealth.cameraOn()) {
                  <div class="self-feed">
                    <span class="self-tag">You</span>
                  </div>
                } @else {
                  <div class="self-off">
                    <i class="pi pi-video-off"></i>
                  </div>
                }
              </div>

              <!-- Call duration -->
              <div class="call-timer">
                <div class="recording-dot"></div>
                <span>{{ telehealth.callDurationFormatted() }}</span>
              </div>

              <!-- Screen sharing banner -->
              @if (telehealth.screenSharing()) {
                <div class="screen-share-banner">
                  <i class="pi pi-desktop"></i>
                  <span>You are sharing your screen</span>
                  <button pButton label="Stop" class="p-button-sm p-button-danger" (click)="telehealth.toggleScreenShare()"></button>
                </div>
              }
            </div>

            <!-- Feature 15.4: Live captions overlay -->
            @if (captionsEnabled()) {
              <div class="captions-overlay" aria-live="polite" aria-atomic="true" role="status">
                <span class="caption-text">{{ currentCaption() }}</span>
              </div>
            }

            <!-- Call controls -->
            <div class="call-controls">
              <button class="control-btn" [class.active]="telehealth.micOn()" [class.muted]="!telehealth.micOn()"
                      (click)="telehealth.toggleMic()" pTooltip="Toggle microphone">
                <i [class]="telehealth.micOn() ? 'pi pi-microphone' : 'pi pi-microphone-slash'"></i>
                <span>{{ telehealth.micOn() ? 'Mute' : 'Unmute' }}</span>
              </button>
              <button class="control-btn" [class.active]="telehealth.cameraOn()" [class.muted]="!telehealth.cameraOn()"
                      (click)="telehealth.toggleCamera()" pTooltip="Toggle camera">
                <i [class]="telehealth.cameraOn() ? 'pi pi-video' : 'pi pi-video-off'"></i>
                <span>{{ telehealth.cameraOn() ? 'Stop Video' : 'Start Video' }}</span>
              </button>
              <button class="control-btn" [class.sharing]="telehealth.screenSharing()"
                      (click)="telehealth.toggleScreenShare()" pTooltip="Share screen">
                <i class="pi pi-desktop"></i>
                <span>{{ telehealth.screenSharing() ? 'Stop Share' : 'Share' }}</span>
              </button>
              <button class="control-btn" [class.chat-active]="telehealth.chatOpen()"
                      (click)="telehealth.toggleChat()" pTooltip="Toggle chat">
                <i class="pi pi-comments"></i>
                <span>Chat</span>
                @if (telehealth.chatMessages().length > 0) {
                  <span class="chat-badge">{{ telehealth.chatMessages().length }}</span>
                }
              </button>
              <!-- Feature 15.4: Captions (CC) button -->
              <button class="control-btn" [class.captions-active]="captionsEnabled()"
                      (click)="toggleCaptions()" pTooltip="Toggle live captions"
                      [attr.aria-pressed]="captionsEnabled()" aria-label="Toggle live captions">
                <i class="pi pi-align-center"></i>
                <span>CC</span>
              </button>
              <button class="control-btn end-call" (click)="telehealth.endCall()" pTooltip="End call">
                <i class="pi pi-phone"></i>
                <span>End</span>
              </button>
            </div>
          </div>

          <!-- Chat sidebar -->
          @if (telehealth.chatOpen()) {
            <div class="chat-sidebar">
              <div class="chat-header">
                <h3>Chat</h3>
                <button pButton icon="pi pi-times" class="p-button-text p-button-rounded p-button-sm"
                        (click)="telehealth.toggleChat()"></button>
              </div>
              <div class="chat-messages" #chatContainer>
                @for (msg of telehealth.chatMessages(); track msg.id) {
                  <div class="chat-msg" [class.sent]="msg.sender === 'patient'" [class.received]="msg.sender === 'provider'">
                    <span class="msg-sender">{{ msg.senderName }}</span>
                    <div class="msg-bubble">{{ msg.text }}</div>
                    <span class="msg-time">{{ msg.timestamp | date:'h:mm a' }}</span>
                  </div>
                } @empty {
                  <div class="chat-empty">
                    <i class="pi pi-comments"></i>
                    <p>No messages yet</p>
                  </div>
                }
              </div>
              <div class="chat-input">
                <input type="text" placeholder="Type a message..." [(ngModel)]="chatInput"
                       (keydown.enter)="sendChat()" class="chat-text-input" />
                <button pButton icon="pi pi-send" class="p-button-rounded send-btn" [disabled]="!chatInput.trim()"
                        (click)="sendChat()"></button>
              </div>
            </div>
          }
        </div>
      }

      <!-- ==================== POST CALL ==================== -->
      @if (telehealth.state() === 'post-call') {
        <div class="post-call">
          <div class="post-card">
            <div class="post-icon">
              <i class="pi pi-check-circle"></i>
            </div>
            <h1>Visit Complete</h1>
            <p class="post-subtitle">Your telehealth visit has ended</p>

            <div class="visit-summary-card">
              <h3>Visit Summary</h3>
              <div class="summary-grid">
                <div class="summary-item">
                  <span class="summary-label">Provider</span>
                  <span class="summary-value">{{ telehealth.session()?.providerName }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Specialty</span>
                  <span class="summary-value">{{ telehealth.session()?.providerSpecialty }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Duration</span>
                  <span class="summary-value">{{ telehealth.callDurationFormatted() }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Date</span>
                  <span class="summary-value">{{ today | date:'MMMM d, y' }}</span>
                </div>
              </div>
            </div>

            <!-- Feature 9.5: Consultation Notes -->
            <div class="consult-section">
              <div class="consult-section-header" (click)="toggleConsultNotes()">
                <div class="consult-title">
                  <i class="pi pi-file-edit"></i>
                  <h3>Consultation Notes</h3>
                </div>
                <i [class]="consultNotesOpen() ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
              </div>
              @if (consultNotesOpen()) {
                <div class="consult-content">
                  <div class="consult-note-item">
                    <strong>Diagnosis</strong>
                    <p>Mild hypertension (Stage 1). Blood pressure readings have been consistently elevated over the past 3 months. No secondary causes identified at this time.</p>
                  </div>
                  <div class="consult-note-item">
                    <strong>Recommendations</strong>
                    <p>1. Initiate lifestyle modifications: reduce sodium intake to &lt;2300mg/day, increase aerobic exercise to 30 min/day, 5 days/week.<br>
                       2. Monitor BP at home twice daily and record readings.<br>
                       3. Consider pharmacological intervention if lifestyle changes are insufficient after 3 months.</p>
                  </div>
                  <div class="consult-note-item">
                    <strong>Follow-up</strong>
                    <p>Return visit in 6 weeks for BP re-evaluation. Repeat lipid panel and metabolic panel at that time.</p>
                  </div>
                </div>
              }
            </div>

            <!-- Feature 9.5: E-Prescription -->
            <div class="consult-section">
              <div class="consult-section-header" (click)="togglePrescriptions()">
                <div class="consult-title">
                  <i class="pi pi-pills"></i>
                  <h3>E-Prescriptions</h3>
                </div>
                <i [class]="prescriptionsOpen() ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
              </div>
              @if (prescriptionsOpen()) {
                <div class="consult-content">
                  @for (rx of mockPrescriptions(); track rx.id) {
                    <div class="prescription-item">
                      <div class="rx-info">
                        <div class="rx-name"><i class="pi pi-pills"></i> {{ rx.name }}</div>
                        <div class="rx-details">{{ rx.dosage }} &bull; {{ rx.frequency }} &bull; {{ rx.quantity }}</div>
                        <div class="rx-instructions">{{ rx.instructions }}</div>
                      </div>
                      <button pButton icon="pi pi-download" label="Download" class="p-button-outlined p-button-sm"
                              (click)="downloadPrescription(rx)"></button>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Feature 9.5: Follow-up Plan -->
            <div class="consult-section">
              <div class="consult-section-header" (click)="toggleFollowUp()">
                <div class="consult-title">
                  <i class="pi pi-list-check"></i>
                  <h3>Follow-up Plan</h3>
                </div>
                <i [class]="followUpOpen() ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
              </div>
              @if (followUpOpen()) {
                <div class="consult-content">
                  <div class="followup-list">
                    @for (step of followUpSteps(); track step.id) {
                      <div class="followup-item" [class.done]="step.done" (click)="toggleFollowUpStep(step.id)">
                        <div class="followup-checkbox">
                          @if (step.done) {
                            <i class="pi pi-check"></i>
                          }
                        </div>
                        <div class="followup-content">
                          <span class="followup-label">{{ step.label }}</span>
                          <span class="followup-due">{{ step.due }}</span>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Feature 9.5: Download Summary button -->
            <div class="download-summary-row">
              <button pButton label="Download Full Summary" icon="pi pi-download"
                      class="p-button-outlined download-summary-btn"
                      (click)="downloadSummary()"></button>
            </div>

            <div class="post-actions-grid">
              <button class="post-action-card" (click)="navigate('/appointments')">
                <i class="pi pi-calendar"></i>
                <span>Schedule Follow-up</span>
              </button>
              <button class="post-action-card" (click)="navigate('/messages')">
                <i class="pi pi-envelope"></i>
                <span>Message Provider</span>
              </button>
              <button class="post-action-card" (click)="navigate('/records')">
                <i class="pi pi-file"></i>
                <span>View Records</span>
              </button>
              <button class="post-action-card" (click)="navigate('/billing')">
                <i class="pi pi-credit-card"></i>
                <span>View Billing</span>
              </button>
            </div>

            <div class="post-footer-actions">
              <button pButton label="Rate Your Visit" icon="pi pi-star" class="p-button-outlined"></button>
              <button pButton label="Return to Dashboard" icon="pi pi-home" (click)="navigate('/dashboard')"></button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .telehealth-page {
      height: calc(100vh - 52px);
      margin: -1.5rem;
      display: flex;
      background: var(--surface-ground);
    }

    /* ===== DEVICE CHECK ===== */
    .device-check {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .check-card {
      background: var(--surface-card);
      border-radius: 16px;
      padding: 2.5rem;
      max-width: 580px;
      width: 100%;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    }

    .check-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .check-icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      background: linear-gradient(135deg, var(--primary-100), var(--primary-50));
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
    }

    .check-icon i {
      font-size: 1.75rem;
      color: var(--primary-600);
    }

    .check-header h1 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
    }

    .check-header p {
      margin: 0;
      color: var(--text-color-secondary);
    }

    .appointment-info-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--surface-50);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;
    }

    .provider-preview {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .provider-preview div:last-child {
      display: flex;
      flex-direction: column;
    }

    .provider-preview strong {
      font-size: 0.9rem;
    }

    .provider-preview span {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
    }

    .provider-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.85rem;
    }

    .time-preview {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-color-secondary);
      font-size: 0.9rem;
    }

    .preview-container {
      margin-bottom: 1.5rem;
    }

    .camera-preview {
      width: 100%;
      height: 240px;
      border-radius: 12px;
      overflow: hidden;
      background: #1a1a2e;
      position: relative;
    }

    .camera-preview.camera-off {
      background: #2d2d44;
    }

    .camera-simulation {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .camera-feed-pattern {
      width: 100%;
      height: 100%;
      background:
        radial-gradient(circle at 50% 40%, #3d3d5c 0%, transparent 60%),
        linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
    }

    .self-label {
      position: absolute;
      bottom: 12px;
      left: 12px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.8rem;
      background: rgba(0, 0, 0, 0.4);
      padding: 0.375rem 0.75rem;
      border-radius: 20px;
    }

    .camera-off-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: rgba(255, 255, 255, 0.5);
      gap: 0.5rem;
    }

    .camera-off-state i {
      font-size: 2rem;
    }

    .preview-controls {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .device-toggle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 2px solid var(--surface-border);
      background: var(--surface-card);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      font-size: 1.1rem;
      color: var(--text-color-secondary);
    }

    .device-toggle.active {
      border-color: var(--primary-color);
      color: var(--primary-color);
      background: var(--primary-50);
    }

    .device-toggle:hover {
      transform: scale(1.05);
    }

    .device-status-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 2rem;
    }

    .device-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: var(--surface-50);
      border-radius: 10px;
    }

    .device-item i {
      font-size: 1.1rem;
      width: 20px;
      text-align: center;
    }

    .device-item i.granted { color: var(--green-600); }
    .device-item i.denied { color: var(--red-600); }
    .device-item i.pending { color: var(--yellow-600); }

    .device-item span:first-of-type {
      flex: 1;
      font-weight: 500;
    }

    .status-tag {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
    }

    .status-tag.granted {
      background: var(--green-50);
      color: var(--green-700);
    }

    .status-tag.denied {
      background: var(--red-50);
      color: var(--red-700);
    }

    .status-tag.pending {
      background: var(--yellow-50);
      color: var(--yellow-700);
    }

    .check-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .join-btn {
      background: linear-gradient(135deg, var(--primary-500), var(--primary-700)) !important;
      border: none !important;
      padding: 0.75rem 2rem !important;
      font-weight: 600 !important;
      border-radius: 10px !important;
    }

    .join-btn:disabled {
      opacity: 0.5 !important;
    }

    /* ===== WAITING ROOM ===== */
    .waiting-room {
      flex: 1;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 2rem;
      overflow-y: auto;
    }

    .waiting-card {
      text-align: center;
      background: var(--surface-card);
      border-radius: 16px;
      padding: 3rem;
      max-width: 580px;
      width: 100%;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    }

    .waiting-visual {
      margin-bottom: 2rem;
    }

    .pulse-ring {
      position: relative;
      width: 100px;
      height: 100px;
      margin: 0 auto;
    }

    .pulse-ring-inner,
    .pulse-ring-outer {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      border: 2px solid var(--primary-color);
      opacity: 0;
      animation: pulse-expand 2s ease-out infinite;
    }

    .pulse-ring-inner {
      width: 60px;
      height: 60px;
    }

    .pulse-ring-outer {
      width: 80px;
      height: 80px;
      animation-delay: 0.5s;
    }

    @keyframes pulse-expand {
      0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
      100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
    }

    .pulse-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-100), var(--primary-50));
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pulse-center i {
      font-size: 1.5rem;
      color: var(--primary-600);
    }

    .waiting-card h1 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
    }

    .waiting-subtitle {
      color: var(--text-color-secondary);
      margin: 0 0 2rem;
    }

    .waiting-details {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .detail-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      color: var(--text-color-secondary);
    }

    .detail-row i {
      color: var(--primary-color);
    }

    /* Feature 9.3: Estimated wait countdown */
    .estimated-wait-section {
      background: var(--primary-50);
      border: 1px solid var(--primary-100);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      margin-bottom: 1rem;
    }

    .wait-countdown {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .wait-countdown > i {
      font-size: 1.75rem;
      color: var(--primary-500);
      flex-shrink: 0;
    }

    .wait-countdown-text {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.15rem;
    }

    .wait-label {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
    }

    .wait-time {
      font-size: 1.25rem;
      color: var(--primary-700);
    }

    .wait-time.ready {
      font-size: 1rem;
      color: var(--green-600);
    }

    /* Feature 9.3: Connection test */
    .connection-test-section {
      background: var(--surface-50);
      border-radius: 12px;
      padding: 0.875rem 1.25rem;
      margin-bottom: 1rem;
    }

    .connection-test-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .connection-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .connection-label i { color: var(--primary-500); }

    .conn-testing {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: var(--text-color-secondary);
    }

    .conn-result {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: var(--green-600);
      font-weight: 600;
    }

    .conn-result i { color: var(--green-600); }

    /* Feature 9.3: Preparation checklist */
    .prep-checklist {
      text-align: left;
      background: var(--surface-50);
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .prep-checklist h3 {
      margin: 0 0 1rem;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--primary-700);
    }

    .checklist-items {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .checklist-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      padding: 0.4rem 0.25rem;
      border-radius: 6px;
      transition: background 0.15s;
      user-select: none;
    }

    .checklist-item:hover { background: var(--surface-100); }

    .checklist-item.checked span {
      color: var(--text-color-secondary);
      text-decoration: line-through;
    }

    .checklist-checkbox {
      width: 20px;
      height: 20px;
      border: 2px solid var(--surface-border);
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.15s;
      background: var(--surface-card);
    }

    .checklist-item.checked .checklist-checkbox {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: white;
    }

    .checklist-checkbox i { font-size: 0.7rem; }

    .checklist-item span { font-size: 0.875rem; }

    .waiting-controls {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .leave-btn {
      width: 100%;
    }

    /* ===== IN CALL ===== */
    .in-call {
      flex: 1;
      display: flex;
      background: #0f0f1a;
    }

    .video-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .provider-video {
      flex: 1;
      position: relative;
      overflow: hidden;
    }

    .video-simulation {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .provider-feed {
      background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    }

    .simulated-person {
      display: flex;
      flex-direction: column;
      align-items: center;
      opacity: 0.15;
    }

    .person-head {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      margin-bottom: 8px;
    }

    .person-body {
      width: 120px;
      height: 80px;
      border-radius: 60px 60px 0 0;
      background: rgba(255, 255, 255, 0.2);
    }

    .provider-name-overlay {
      position: absolute;
      bottom: 80px;
      left: 20px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .provider-name-overlay span:first-child {
      color: white;
      font-weight: 600;
      font-size: 1rem;
      background: rgba(0, 0, 0, 0.5);
      padding: 0.375rem 0.875rem;
      border-radius: 8px;
    }

    .specialty-tag {
      color: rgba(255, 255, 255, 0.7) !important;
      font-weight: 400 !important;
      font-size: 0.85rem !important;
      background: rgba(0, 0, 0, 0.35) !important;
      padding: 0.375rem 0.75rem !important;
      border-radius: 8px !important;
    }

    /* Feature 9.4: Screen share view */
    .screen-share-view {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1a1a3e 0%, #0a0a20 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .browser-mockup {
      width: 85%;
      max-width: 720px;
      background: #1e1e2e;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .browser-chrome {
      background: #2a2a3e;
      padding: 0.6rem 0.875rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .browser-dots {
      display: flex;
      gap: 5px;
      flex-shrink: 0;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .dot.red { background: #ff5f57; }
    .dot.yellow { background: #febc2e; }
    .dot.green { background: #28c840; }

    .browser-url-bar {
      flex: 1;
      background: rgba(255, 255, 255, 0.07);
      border-radius: 6px;
      padding: 0.3rem 0.75rem;
      font-size: 0.72rem;
      color: rgba(255, 255, 255, 0.6);
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-family: monospace;
    }

    .share-tab-selector {
      flex-shrink: 0;
    }

    .browser-content {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .mock-page-header {
      height: 14px;
      background: rgba(255, 255, 255, 0.12);
      border-radius: 4px;
      width: 45%;
    }

    .mock-page-row {
      height: 8px;
      background: rgba(255, 255, 255, 0.07);
      border-radius: 4px;
    }

    .mock-page-row.short { width: 70%; }

    .mock-page-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.6rem;
      margin-top: 0.25rem;
    }

    .mock-card {
      height: 52px;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .screen-share-label {
      position: absolute;
      bottom: 90px;
      left: 16px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(34, 197, 94, 0.85);
      color: white;
      padding: 0.375rem 0.875rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .self-video {
      position: absolute;
      bottom: 80px;
      right: 20px;
      width: 200px;
      height: 140px;
      border-radius: 12px;
      overflow: hidden;
      border: 2px solid rgba(255, 255, 255, 0.2);
      background: #2d2d44;
    }

    .self-feed {
      width: 100%;
      height: 100%;
      background:
        radial-gradient(circle at 50% 40%, #3d3d5c 0%, transparent 50%),
        linear-gradient(180deg, #2d2d44 0%, #1a1a2e 100%);
      position: relative;
    }

    .self-tag {
      position: absolute;
      bottom: 8px;
      left: 8px;
      color: white;
      font-size: 0.75rem;
      background: rgba(0, 0, 0, 0.5);
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
    }

    .self-off {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.4);
      font-size: 1.5rem;
    }

    .self-video.camera-off {
      background: #1e1e30;
    }

    .call-timer {
      position: absolute;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(0, 0, 0, 0.5);
      padding: 0.5rem 1rem;
      border-radius: 20px;
      color: white;
      font-size: 0.9rem;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }

    .recording-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--red-500);
      animation: blink 1.5s ease-in-out infinite;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    .screen-share-banner {
      position: absolute;
      top: 16px;
      left: 16px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(34, 197, 94, 0.9);
      padding: 0.5rem 1rem;
      border-radius: 8px;
      color: white;
      font-size: 0.85rem;
    }

    .call-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 1rem 2rem;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(10px);
    }

    .control-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 0.75rem 1.25rem;
      border: none;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      font-family: inherit;
    }

    .control-btn i {
      font-size: 1.25rem;
    }

    .control-btn span {
      font-size: 0.7rem;
    }

    .control-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .control-btn.muted {
      background: rgba(239, 68, 68, 0.3);
      color: var(--red-300);
    }

    .control-btn.sharing {
      background: rgba(34, 197, 94, 0.3);
      color: var(--green-300);
    }

    .control-btn.chat-active {
      background: rgba(59, 130, 246, 0.3);
      color: var(--blue-300);
    }

    /* Feature 15.4: Captions active state */
    .control-btn.captions-active {
      background: rgba(168, 85, 247, 0.3);
      color: var(--purple-300);
    }

    /* Feature 15.4: Captions overlay */
    .captions-overlay {
      position: absolute;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      width: 80%;
      max-width: 720px;
      padding: 0.75rem 1.5rem;
      background: rgba(0, 0, 0, 0.78);
      border-radius: 10px;
      text-align: center;
      pointer-events: none;
      z-index: 10;
    }

    .caption-text {
      color: white;
      font-size: 1.05rem;
      font-weight: 500;
      line-height: 1.5;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
      letter-spacing: 0.01em;
    }

    .control-btn.end-call {
      background: var(--red-500);
      padding: 0.75rem 2rem;
      border-radius: 24px;
    }

    .control-btn.end-call:hover {
      background: var(--red-600);
    }

    .control-btn.end-call i {
      transform: rotate(135deg);
    }

    .chat-badge {
      position: absolute;
      top: 2px;
      right: 4px;
      min-width: 16px;
      height: 16px;
      border-radius: 8px;
      background: var(--blue-500);
      font-size: 0.6rem;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 3px;
    }

    /* ===== CHAT SIDEBAR ===== */
    .chat-sidebar {
      width: 340px;
      background: var(--surface-card);
      display: flex;
      flex-direction: column;
      border-left: 1px solid var(--surface-border);
    }

    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .chat-header h3 {
      margin: 0;
      font-size: 1rem;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .chat-empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-color-secondary);
    }

    .chat-empty i {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      opacity: 0.4;
    }

    .chat-msg {
      display: flex;
      flex-direction: column;
      max-width: 85%;
    }

    .chat-msg.sent {
      align-self: flex-end;
      align-items: flex-end;
    }

    .chat-msg.received {
      align-self: flex-start;
      align-items: flex-start;
    }

    .msg-sender {
      font-size: 0.7rem;
      color: var(--text-color-secondary);
      margin-bottom: 0.25rem;
    }

    .msg-bubble {
      padding: 0.625rem 1rem;
      border-radius: 12px;
      font-size: 0.875rem;
      line-height: 1.4;
    }

    .sent .msg-bubble {
      background: var(--primary-color);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .received .msg-bubble {
      background: var(--surface-100);
      color: var(--text-color);
      border-bottom-left-radius: 4px;
    }

    .msg-time {
      font-size: 0.65rem;
      color: var(--text-color-secondary);
      margin-top: 0.25rem;
    }

    .chat-input {
      display: flex;
      gap: 0.5rem;
      padding: 1rem;
      border-top: 1px solid var(--surface-border);
    }

    .chat-text-input {
      flex: 1;
      padding: 0.625rem 1rem;
      border: 1px solid var(--surface-border);
      border-radius: 20px;
      outline: none;
      font-size: 0.875rem;
      font-family: inherit;
      background: var(--surface-50);
      color: var(--text-color);
    }

    .chat-text-input:focus {
      border-color: var(--primary-color);
    }

    .send-btn {
      width: 38px !important;
      height: 38px !important;
    }

    /* ===== POST CALL ===== */
    .post-call {
      flex: 1;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 2rem;
      overflow-y: auto;
    }

    .post-card {
      text-align: center;
      background: var(--surface-card);
      border-radius: 16px;
      padding: 3rem;
      max-width: 680px;
      width: 100%;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    }

    .post-icon {
      margin-bottom: 1.5rem;
    }

    .post-icon i {
      font-size: 4rem;
      color: var(--green-500);
    }

    .post-card h1 {
      margin: 0 0 0.5rem;
      font-size: 1.75rem;
    }

    .post-subtitle {
      color: var(--text-color-secondary);
      margin: 0 0 2rem;
    }

    .visit-summary-card {
      background: var(--surface-50);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      text-align: left;
    }

    .visit-summary-card h3 {
      margin: 0 0 1rem;
      font-size: 1rem;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .summary-label {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
    }

    .summary-value {
      font-weight: 600;
      font-size: 0.95rem;
    }

    /* Feature 9.5: Consultation sections */
    .consult-section {
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 1rem;
      text-align: left;
    }

    .consult-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      cursor: pointer;
      background: var(--surface-50);
      transition: background 0.15s;
      user-select: none;
    }

    .consult-section-header:hover {
      background: var(--surface-100);
    }

    .consult-title {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .consult-title i {
      color: var(--primary-500);
      font-size: 1rem;
    }

    .consult-title h3 {
      margin: 0;
      font-size: 0.95rem;
    }

    .consult-section-header > i:last-child {
      color: var(--text-color-secondary);
      font-size: 0.85rem;
    }

    .consult-content {
      padding: 1.25rem;
      border-top: 1px solid var(--surface-border);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .consult-note-item strong {
      display: block;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--primary-600);
      margin-bottom: 0.4rem;
    }

    .consult-note-item p {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-color);
      line-height: 1.6;
    }

    /* Feature 9.5: Prescriptions */
    .prescription-item {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.875rem;
      background: var(--surface-50);
      border-radius: 8px;
      border: 1px solid var(--surface-border);
    }

    .rx-info { flex: 1; }

    .rx-name {
      font-weight: 600;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.3rem;
    }

    .rx-name i { color: var(--primary-500); font-size: 0.9rem; }

    .rx-details {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      margin-bottom: 0.25rem;
    }

    .rx-instructions {
      font-size: 0.8rem;
      color: var(--text-color);
      font-style: italic;
    }

    /* Feature 9.5: Follow-up plan */
    .followup-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .followup-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      cursor: pointer;
      padding: 0.5rem 0.25rem;
      border-radius: 6px;
      transition: background 0.15s;
      user-select: none;
    }

    .followup-item:hover { background: var(--surface-100); }

    .followup-checkbox {
      width: 22px;
      height: 22px;
      border: 2px solid var(--surface-border);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
      transition: all 0.15s;
      background: var(--surface-card);
    }

    .followup-item.done .followup-checkbox {
      background: var(--green-500);
      border-color: var(--green-500);
      color: white;
    }

    .followup-checkbox i { font-size: 0.65rem; }

    .followup-content {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .followup-label {
      font-size: 0.875rem;
    }

    .followup-item.done .followup-label {
      text-decoration: line-through;
      color: var(--text-color-secondary);
    }

    .followup-due {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    /* Feature 9.5: Download summary */
    .download-summary-row {
      display: flex;
      justify-content: flex-start;
      margin-bottom: 1.5rem;
    }

    .download-summary-btn {
      gap: 0.5rem;
    }

    .post-actions-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .post-action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1.25rem 0.75rem;
      background: var(--surface-50);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
      color: var(--text-color);
    }

    .post-action-card:hover {
      background: var(--primary-50);
      border-color: var(--primary-200);
      transform: translateY(-2px);
    }

    .post-action-card i {
      font-size: 1.5rem;
      color: var(--primary-color);
    }

    .post-action-card span {
      font-size: 0.8rem;
      font-weight: 500;
    }

    .post-footer-actions {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 768px) {
      .check-card, .waiting-card, .post-card {
        padding: 1.5rem;
      }

      .self-video {
        width: 120px;
        height: 90px;
        bottom: 80px;
        right: 10px;
      }

      .chat-sidebar {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        z-index: 10;
        width: 300px;
        box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
      }

      .call-controls {
        gap: 0.5rem;
        padding: 1rem;
      }

      .control-btn {
        padding: 0.625rem 0.75rem;
      }

      .post-actions-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .appointment-info-bar {
        flex-direction: column;
        gap: 0.75rem;
        align-items: flex-start;
      }
    }
  `]
})
export class TelehealthComponent implements OnInit, OnDestroy {
  readonly telehealth = inject(TelehealthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  chatInput = '';
  today = new Date();

  // ─── Feature 9.3: Waiting room state ────────────────────────────────────────
  waitCountdownSeconds = signal(300); // ~5 minutes
  connectionTestStatus = signal<'idle' | 'testing' | 'done'>('idle');
  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  prepChecklist = signal([
    { id: 'quiet', label: 'In a quiet, well-lit space', done: false },
    { id: 'meds',  label: 'Medication list is nearby', done: false },
    { id: 'questions', label: 'Questions written down for provider', done: false },
    { id: 'tabs', label: 'Unnecessary browser tabs closed', done: false },
    { id: 'charged', label: 'Device is charged or plugged in', done: false }
  ]);

  // ─── Feature 15.4: Live captions ────────────────────────────────────────────
  captionsEnabled = signal(false);
  currentCaption = signal('');
  private captionTimer: ReturnType<typeof setInterval> | null = null;
  private captionIndex = 0;

  private readonly captionPhrases = [
    'How have you been feeling since our last visit?',
    "I've been taking the medication as prescribed.",
    'Let me check your latest lab results.',
    'Your blood pressure looks much better today.',
    "I'd recommend we schedule a follow-up in 6 weeks.",
  ];

  // ─── Feature 9.4: Screen share tab options ──────────────────────────────────
  readonly shareTabOptions = [
    { label: 'Health Records', value: 'Health Records' },
    { label: 'Lab Results', value: 'Lab Results' },
    { label: 'Medication List', value: 'Medication List' },
    { label: 'Entire Screen', value: 'Entire Screen' }
  ];
  selectedShareTab = 'Health Records';

  // ─── Feature 9.5: Post-call section states ──────────────────────────────────
  consultNotesOpen = signal(true);
  prescriptionsOpen = signal(false);
  followUpOpen = signal(false);

  readonly mockPrescriptions = signal<Array<{
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    quantity: string;
    instructions: string;
  }>>([]);

  followUpSteps = signal([
    { id: 'bp', label: 'Monitor blood pressure twice daily and log readings', done: false, due: 'Starting today' },
    { id: 'sodium', label: 'Reduce sodium intake below 2300mg per day', done: false, due: 'Ongoing' },
    { id: 'exercise', label: 'Begin 30-minute aerobic exercise routine, 5 days/week', done: false, due: 'This week' },
    { id: 'labs', label: 'Schedule repeat lipid panel and metabolic panel', done: false, due: 'Before follow-up visit' },
    { id: 'followup', label: 'Return visit for BP re-evaluation', done: false, due: 'In 6 weeks' }
  ]);

  ngOnInit(): void {
    const appointmentId = this.route.snapshot.paramMap.get('appointmentId') || 'APT-002';
    this.telehealth.initSession(appointmentId);
    this.telehealth.checkDevicePermissions();
    this.loadPrescriptions();
  }

  private async loadPrescriptions(): Promise<void> {
    const patientId = this.authService.user()?.patientId
      ?? localStorage.getItem('portal_patient_id');
    if (!patientId) return;

    const token = localStorage.getItem('portal_token') || '';
    try {
      const resp = await fetch(
        `/api/v1/portal/patients/${patientId}/medications?page=1&page_size=50`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (!resp.ok) return;
      const data: {
        medications?: Array<{
          id: string;
          medication_name: string;
          dosage: string;
          frequency: string;
          refills_remaining?: number;
          instructions?: string;
        }>;
      } = await resp.json();
      const mapped = (data.medications ?? []).map(m => ({
        id: m.id,
        name: m.medication_name,
        dosage: m.dosage || '',
        frequency: m.frequency || '',
        quantity: m.refills_remaining !== undefined
          ? `${m.refills_remaining} refill(s) remaining`
          : '',
        instructions: m.instructions || '',
      }));
      this.mockPrescriptions.set(mapped);
    } catch { /* leave empty */ }
  }

  ngOnDestroy(): void {
    this.telehealth.cleanup();
    this.stopCountdown();
    this.stopCaptions();
  }

  // ─── Feature 9.3: Countdown timer management ────────────────────────────────
  private startCountdown(): void {
    this.stopCountdown();
    this.waitCountdownSeconds.set(300);
    this.countdownTimer = setInterval(() => {
      const current = this.waitCountdownSeconds();
      if (current > 0) {
        this.waitCountdownSeconds.update(s => s - 1);
      } else {
        this.stopCountdown();
      }
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  formatCountdown(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) {
      return `~${m} minute${m !== 1 ? 's' : ''}`;
    }
    return `${s} second${s !== 1 ? 's' : ''}`;
  }

  // ─── Feature 9.3: Connection test ───────────────────────────────────────────
  runConnectionTest(): void {
    this.connectionTestStatus.set('testing');
    setTimeout(() => {
      this.connectionTestStatus.set('done');
    }, 1800);
  }

  // ─── Feature 9.3: Checklist toggle ──────────────────────────────────────────
  toggleChecklist(id: string): void {
    this.prepChecklist.update(items =>
      items.map(item => item.id === id ? { ...item, done: !item.done } : item)
    );
  }

  // Need to hook into state changes to start countdown — use getter approach
  // We'll start countdown when component enters waiting room via the service
  // In real app this would use an effect(); here we patch joinWaitingRoom lifecycle
  // via overriding the service call in template action (inline):

  joinWaitingRoomWithCountdown(): void {
    this.telehealth.joinWaitingRoom();
    this.startCountdown();
  }

  sendChat(): void {
    if (this.chatInput.trim()) {
      this.telehealth.sendMessage(this.chatInput);
      this.chatInput = '';
    }
  }

  goBack(): void {
    this.router.navigate(['/appointments']);
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  // ─── Feature 9.5: Post-call section toggles ─────────────────────────────────
  toggleConsultNotes(): void {
    this.consultNotesOpen.update(v => !v);
  }

  togglePrescriptions(): void {
    this.prescriptionsOpen.update(v => !v);
  }

  toggleFollowUp(): void {
    this.followUpOpen.update(v => !v);
  }

  toggleFollowUpStep(id: string): void {
    this.followUpSteps.update(steps =>
      steps.map(s => s.id === id ? { ...s, done: !s.done } : s)
    );
  }

  downloadPrescription(rx: { id: string; name: string }): void {
    console.log('Downloading prescription:', rx.name);
    // Mock download — in production would call a backend endpoint
    const blob = new Blob(
      [`PRESCRIPTION\n\nPatient: Demo Patient\nDate: ${new Date().toLocaleDateString()}\n\nMedication: ${rx.name}\n\nThis is a mock prescription document.`],
      { type: 'text/plain' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prescription-${rx.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── Feature 15.4: Captions management ──────────────────────────────────────

  toggleCaptions(): void {
    if (this.captionsEnabled()) {
      this.captionsEnabled.set(false);
      this.stopCaptions();
      this.currentCaption.set('');
    } else {
      this.captionsEnabled.set(true);
      this.startCaptions();
    }
  }

  private startCaptions(): void {
    this.stopCaptions();
    // Show first phrase immediately
    this.currentCaption.set(this.captionPhrases[this.captionIndex % this.captionPhrases.length]);
    this.captionTimer = setInterval(() => {
      this.captionIndex = (this.captionIndex + 1) % this.captionPhrases.length;
      this.currentCaption.set(this.captionPhrases[this.captionIndex]);
    }, 3500);
  }

  private stopCaptions(): void {
    if (this.captionTimer) {
      clearInterval(this.captionTimer);
      this.captionTimer = null;
    }
  }

  downloadSummary(): void {
    console.log('Downloading consultation summary');
    const session = this.telehealth.session();
    const blob = new Blob(
      [`CONSULTATION SUMMARY\n\nDate: ${new Date().toLocaleDateString()}\nProvider: ${session?.providerName}\nSpecialty: ${session?.providerSpecialty}\nDuration: ${this.telehealth.callDurationFormatted()}\n\nDIAGNOSIS\nMild hypertension (Stage 1).\n\nRECOMMENDATIONS\n1. Reduce sodium intake\n2. Increase aerobic exercise\n3. Monitor BP daily\n\nFOLLOW-UP\nReturn in 6 weeks for BP re-evaluation.\n\n---\nGoHealth Patient Portal | HIPAA Secured`],
      { type: 'text/plain' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consultation-summary-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
