/**
 * family-chart.component.ts
 *
 * Full-page pedigree chart with:
 *   - Left toolbar (60px): zoom controls, view mode toggle, legend toggle, export menu
 *   - Centre canvas: D3 pan/zoom SVG with semantic zoom levels
 *   - Right detail panel (340px collapsible): member details via ChartDetailPanelComponent
 *   - Bottom-right minimap (200x130px)
 *   - Full keyboard navigation (Tab cycles nodes, Enter selects, Escape deselects)
 *   - Context menu (right-click): add partner/child, edit, permissions, remove
 *   - Hover tooltip
 *   - Ctrl+click multi-select (max 5)
 *   - Double-click: zoom to subtree
 */

import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { SidebarModule } from 'primeng/sidebar';
import { SelectButtonModule } from 'primeng/selectbutton';
import * as d3 from 'd3';

import { FamilyService } from '../data-access/family.service';
import { ChartLayoutService, ChartNode, ChartLink } from '../data-access/chart-layout.service';
import { PetProfile } from '../data-access/family.models';
import { renderHumanNode, renderPetNode, renderLink } from '../utils/chart-nodes.util';
import {
  ChartViewMode,
  applyGeneticsView,
  applyPermissionsView,
  applyRiskView,
} from '../utils/chart-view-modes.util';
import { exportSVG, exportPNG, exportPrintableHTML, exportCanRisk, exportPED } from '../utils/chart-export.util';
import { ChartDetailPanelComponent } from '../ui/chart-detail-panel.component';
import { ChartLegendComponent } from '../ui/chart-legend.component';

// =============================================================================
// Component
// =============================================================================

@Component({
  selector: 'app-family-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ButtonModule,
    TooltipModule,
    MenuModule,
    SidebarModule,
    SelectButtonModule,
    ChartDetailPanelComponent,
    ChartLegendComponent,
  ],
  template: `
    <div class="chart-root" [class.embedded-mode]="embedded" (keydown)="onKeyDown($event)" tabindex="-1">

      <!-- ── LEFT TOOLBAR ─────────────────────────────────────────────────── -->
      <nav class="chart-toolbar" *ngIf="!embedded" aria-label="Chart controls">

        <!-- Zoom In -->
        <button
          pButton
          type="button"
          icon="pi pi-search-plus"
          class="p-button-text toolbar-btn"
          pTooltip="Zoom In"
          tooltipPosition="right"
          aria-label="Zoom in"
          (click)="zoomIn()"
        ></button>

        <!-- Zoom Out -->
        <button
          pButton
          type="button"
          icon="pi pi-search-minus"
          class="p-button-text toolbar-btn"
          pTooltip="Zoom Out"
          tooltipPosition="right"
          aria-label="Zoom out"
          (click)="zoomOut()"
        ></button>

        <!-- Fit All -->
        <button
          pButton
          type="button"
          icon="pi pi-expand"
          class="p-button-text toolbar-btn"
          pTooltip="Fit All"
          tooltipPosition="right"
          aria-label="Fit all nodes in view"
          (click)="fitAll()"
        ></button>

        <div class="toolbar-divider"></div>

        <!-- Genetics view -->
        <button
          pButton
          type="button"
          icon="pi pi-dna"
          class="p-button-text toolbar-btn"
          [class.toolbar-btn-active]="viewMode() === 'genetics'"
          pTooltip="Genetics view"
          tooltipPosition="right"
          aria-label="Switch to genetics view"
          (click)="setViewMode('genetics')"
        ></button>

        <!-- Permissions view -->
        <button
          pButton
          type="button"
          icon="pi pi-lock"
          class="p-button-text toolbar-btn"
          [class.toolbar-btn-active]="viewMode() === 'permissions'"
          pTooltip="Permissions view"
          tooltipPosition="right"
          aria-label="Switch to permissions view"
          (click)="setViewMode('permissions')"
        ></button>

        <!-- Risk view -->
        <button
          pButton
          type="button"
          icon="pi pi-chart-line"
          class="p-button-text toolbar-btn"
          [class.toolbar-btn-active]="viewMode() === 'risk'"
          pTooltip="Risk view"
          tooltipPosition="right"
          aria-label="Switch to risk view"
          (click)="setViewMode('risk')"
        ></button>

        <div class="toolbar-divider"></div>

        <!-- Toggle legend -->
        <button
          pButton
          type="button"
          icon="pi pi-list"
          class="p-button-text toolbar-btn"
          pTooltip="Toggle Legend"
          tooltipPosition="right"
          aria-label="Toggle legend"
          (click)="toggleLegend()"
        ></button>

        <!-- Export menu -->
        <button
          pButton
          type="button"
          icon="pi pi-download"
          class="p-button-text toolbar-btn"
          pTooltip="Export"
          tooltipPosition="right"
          aria-label="Export chart"
          (click)="exportMenu.toggle($event)"
        ></button>
        <p-menu #exportMenu [model]="exportMenuItems" [popup]="true"></p-menu>

      </nav>

      <!-- ── CENTRE CANVAS ──────────────────────────────────────────────── -->
      <main class="chart-canvas-wrap" aria-label="Family pedigree chart">

        <!-- Main SVG -->
        <svg
          #chartSvg
          class="chart-svg"
          role="application"
          aria-label="Family pedigree"
          [attr.aria-activedescendant]="selectedMemberId() ?? undefined"
        >
          <defs>
            <!-- Arrow marker for proband arrowhead -->
            <marker
              id="arrowhead"
              markerWidth="8" markerHeight="8"
              refX="4" refY="4"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L0,8 L8,4 Z" fill="#374151"></path>
            </marker>
          </defs>
          <!-- D3 content injected here -->
        </svg>

        <!-- Hover tooltip -->
        <div
          #tooltip
          class="chart-tooltip"
          [class.visible]="tooltipVisible()"
          [style.left.px]="tooltipX()"
          [style.top.px]="tooltipY()"
          role="tooltip"
          aria-live="polite"
        >
          <div class="tooltip-name">{{ tooltipData().name }}</div>
          <div class="tooltip-rel">{{ tooltipData().relationship }}</div>
          <div class="tooltip-conditions" *ngIf="tooltipData().conditions">
            {{ tooltipData().conditions }}
          </div>
        </div>

        <!-- Context menu -->
        <div
          #contextMenuEl
          class="chart-context-menu"
          [class.visible]="contextMenuVisible()"
          [style.left.px]="contextMenuX()"
          [style.top.px]="contextMenuY()"
          role="menu"
          aria-label="Node actions"
        >
          <button
            *ngFor="let item of contextMenuItems"
            class="context-menu-item"
            role="menuitem"
            (click)="item.action()"
          >
            <i [class]="item.icon"></i>
            <span>{{ item.label }}</span>
          </button>
        </div>

        <!-- Multi-select bulk edit button -->
        <div class="bulk-edit-bar" *ngIf="multiSelection().length > 1">
          <span>{{ multiSelection().length }} members selected</span>
          <button pButton type="button" label="Bulk Edit" icon="pi pi-pencil" class="p-button-sm"></button>
          <button
            pButton
            type="button"
            icon="pi pi-times"
            class="p-button-sm p-button-text"
            (click)="clearSelection()"
            aria-label="Clear selection"
          ></button>
        </div>

        <!-- Legend (bottom-left) -->
        <app-chart-legend
          *ngIf="legendVisible()"
          [viewMode]="viewMode()"
        ></app-chart-legend>

        <!-- Minimap (bottom-right) -->
        <div class="chart-minimap" *ngIf="!embedded" aria-hidden="true">
          <svg #minimapSvg class="minimap-svg" width="200" height="130">
            <!-- Content cloned and scaled by D3 -->
          </svg>
          <!-- Viewport rectangle -->
          <div
            class="minimap-viewport"
            [style.left.px]="minimapViewport().x"
            [style.top.px]="minimapViewport().y"
            [style.width.px]="minimapViewport().w"
            [style.height.px]="minimapViewport().h"
          ></div>
        </div>

      </main>

      <!-- ── RIGHT DETAIL PANEL ─────────────────────────────────────────── -->
      <aside
        *ngIf="!embedded"
        class="chart-detail-sidebar"
        [class.collapsed]="!detailPanelOpen()"
        aria-label="Member details"
      >
        <app-chart-detail-panel
          [member]="selectedMember()"
          [pet]="selectedPet()"
          (closed)="closeDetailPanel()"
        ></app-chart-detail-panel>
      </aside>

    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .chart-root {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: #f8fafc;
      outline: none;
    }

    .chart-root.embedded-mode {
      height: 100%;
      border-radius: 8px;
      border: 1px solid var(--surface-border, #e5e7eb);
    }

    /* ── LEFT TOOLBAR ──────────────────────────────────────────────────── */

    .chart-toolbar {
      width: 56px;
      flex-shrink: 0;
      background: #1f2937;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 0;
      gap: 4px;
      z-index: 10;
    }

    .toolbar-btn {
      width: 40px !important;
      height: 40px !important;
      border-radius: 8px !important;
      color: #9ca3af !important;
      transition: color 0.15s, background 0.15s;
    }

    .toolbar-btn:hover {
      color: #fff !important;
      background: rgba(255,255,255,0.1) !important;
    }

    .toolbar-btn-active {
      color: #34d399 !important;
      background: rgba(52,211,153,0.12) !important;
    }

    .toolbar-divider {
      width: 32px;
      height: 1px;
      background: rgba(255,255,255,0.15);
      margin: 4px 0;
    }

    /* ── CENTRE CANVAS ─────────────────────────────────────────────────── */

    .chart-canvas-wrap {
      flex: 1;
      position: relative;
      overflow: hidden;
      background:
        radial-gradient(circle, #e5e7eb 1px, transparent 1px) 0 0 / 24px 24px;
    }

    .chart-svg {
      width: 100%;
      height: 100%;
      cursor: grab;
    }

    .chart-svg:active {
      cursor: grabbing;
    }

    /* ── TOOLTIP ───────────────────────────────────────────────────────── */

    .chart-tooltip {
      position: absolute;
      background: rgba(17,24,39,0.92);
      color: #f9fafb;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s;
      max-width: 200px;
      z-index: 50;
    }

    .chart-tooltip.visible { opacity: 1; }

    .tooltip-name {
      font-weight: 700;
      font-size: 13px;
    }

    .tooltip-rel {
      color: #9ca3af;
      text-transform: capitalize;
      margin-top: 2px;
    }

    .tooltip-conditions {
      margin-top: 4px;
      color: #fca5a5;
      font-size: 11px;
    }

    /* ── CONTEXT MENU ──────────────────────────────────────────────────── */

    .chart-context-menu {
      position: absolute;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      min-width: 180px;
      padding: 4px 0;
      z-index: 100;
      display: none;
    }

    .chart-context-menu.visible { display: block; }

    .context-menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      font-size: 13px;
      color: #374151;
      background: none;
      border: none;
      width: 100%;
      cursor: pointer;
      text-align: left;
      transition: background 0.1s;
    }

    .context-menu-item:hover {
      background: #f3f4f6;
    }

    /* ── BULK EDIT BAR ─────────────────────────────────────────────────── */

    .bulk-edit-bar {
      position: absolute;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      background: #1f2937;
      color: #f9fafb;
      padding: 8px 16px;
      border-radius: 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.3);
      z-index: 30;
    }

    /* ── MINIMAP ───────────────────────────────────────────────────────── */

    .chart-minimap {
      position: absolute;
      bottom: 16px;
      right: 16px;
      width: 200px;
      height: 130px;
      background: rgba(255,255,255,0.92);
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
      z-index: 20;
    }

    .minimap-svg {
      display: block;
    }

    .minimap-viewport {
      position: absolute;
      border: 2px solid #0d9488;
      background: rgba(13,148,136,0.08);
      pointer-events: none;
      border-radius: 2px;
    }

    /* ── RIGHT DETAIL PANEL ────────────────────────────────────────────── */

    .chart-detail-sidebar {
      width: 340px;
      flex-shrink: 0;
      border-left: 1px solid #e5e7eb;
      background: #fff;
      overflow: hidden;
      transition: width 0.25s ease;
      display: flex;
      flex-direction: column;
    }

    .chart-detail-sidebar.collapsed {
      width: 0;
      border-left: none;
    }

    /* ── SEMANTIC ZOOM: hide/show labels ───────────────────────────────── */

    :host ::ng-deep .chart-svg .node-label {
      opacity: 0;
      transition: opacity 0.2s;
    }

    :host ::ng-deep .chart-svg.zoom-names .node-label,
    :host ::ng-deep .chart-svg.zoom-full  .node-label {
      opacity: 1;
    }

    :host ::ng-deep .chart-svg .condition-tag {
      display: none;
    }

    :host ::ng-deep .chart-svg.zoom-tags .condition-tag,
    :host ::ng-deep .chart-svg.zoom-full .condition-tag {
      display: block;
    }
  `],
})
export class FamilyChartComponent implements OnInit, AfterViewInit, OnDestroy {

  /** When true, hides toolbar, detail panel & minimap — for embedding in dashboard/history. */
  @Input() embedded = false;

  /** Emits the selected member's ID when a node is clicked (useful in embedded mode). */
  @Output() nodeSelected = new EventEmitter<string>();

  @ViewChild('chartSvg', { static: true })
  private chartSvgRef!: ElementRef<SVGSVGElement>;

  @ViewChild('minimapSvg')
  private minimapSvgRef!: ElementRef<SVGSVGElement>;

  // ── Injected services ────────────────────────────────────────────────────

  private readonly familyService   = inject(FamilyService);
  private readonly layoutService   = inject(ChartLayoutService);
  private readonly cdr             = inject(ChangeDetectorRef);
  private readonly zone            = inject(NgZone);

  // ── State signals ────────────────────────────────────────────────────────

  readonly viewMode       = signal<ChartViewMode>('genetics');
  readonly zoomLevel      = signal<number>(1);
  readonly legendVisible  = signal<boolean>(true);
  readonly detailPanelOpen = signal<boolean>(false);
  readonly multiSelection = signal<string[]>([]);

  // Tooltip
  readonly tooltipVisible = signal<boolean>(false);
  readonly tooltipX       = signal<number>(0);
  readonly tooltipY       = signal<number>(0);
  readonly tooltipData    = signal<{ name: string; relationship: string; conditions: string }>({
    name: '', relationship: '', conditions: '',
  });

  // Context menu
  readonly contextMenuVisible = signal<boolean>(false);
  readonly contextMenuX       = signal<number>(0);
  readonly contextMenuY       = signal<number>(0);

  // Minimap viewport indicator
  readonly minimapViewport = signal<{ x: number; y: number; w: number; h: number }>({
    x: 0, y: 0, w: 40, h: 26,
  });

  // ── Computed helpers ─────────────────────────────────────────────────────

  readonly selectedMemberId = computed(() => this.familyService.selectedMemberId());
  readonly selectedMember   = computed(() => this.familyService.selectedMember());

  readonly selectedPet = computed<PetProfile | null>(() => {
    const id = this._selectedPetId();
    if (!id) return null;
    return this.familyService.pets().find(p => p.id === id) ?? null;
  });

  private readonly _selectedPetId = signal<string | null>(null);

  // ── D3 internals ─────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private d3Svg!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private zoomBehavior!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mainGroup!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private minimapGroup!: any;

  private nodes: ChartNode[] = [];
  private links: ChartLink[] = [];
  private nodeMap = new Map<string, ChartNode>();
  private focusedNodeIndex = 0;
  private contextMenuTargetId: string | null = null;

  // ── Context menu items (dynamic, set per right-click) ────────────────────

  contextMenuItems: Array<{ label: string; icon: string; action: () => void }> = [];

  // ── Export menu items ─────────────────────────────────────────────────────

  readonly exportMenuItems = [
    {
      label: 'Export SVG',
      icon: 'pi pi-image',
      command: () => this.doExportSVG(),
    },
    {
      label: 'Export PNG',
      icon: 'pi pi-image',
      command: () => this.doExportPNG(),
    },
    {
      label: 'Print (HTML)',
      icon: 'pi pi-print',
      command: () => this.doExportPrint(),
    },
    {
      label: 'Export CanRisk',
      icon: 'pi pi-file',
      command: () => this.doExportCanRisk(),
    },
    {
      label: 'Export PED',
      icon: 'pi pi-file',
      command: () => this.doExportPED(),
    },
  ];

  // ── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Nothing needed here; D3 initialisation requires the DOM (AfterViewInit)
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.initD3();
      this.renderChart();
    });
  }

  ngOnDestroy(): void {
    // D3 selections hold no persistent subscriptions to clean up beyond GC
  }

  // ── D3 initialisation ────────────────────────────────────────────────────

  private initD3(): void {
    const svgEl = this.chartSvgRef.nativeElement;
    this.d3Svg  = d3.select(svgEl);

    // Pan / zoom behaviour
    this.zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        this.mainGroup.attr('transform', event.transform.toString());
        const k = event.transform.k;

        // Semantic zoom CSS classes on the SVG element
        const svgNode = this.chartSvgRef.nativeElement;
        svgNode.classList.remove('zoom-names', 'zoom-tags', 'zoom-full');
        if (k >= 2.0) {
          svgNode.classList.add('zoom-full');
        } else if (k >= 1.0) {
          svgNode.classList.add('zoom-tags');
        } else if (k >= 0.5) {
          svgNode.classList.add('zoom-names');
        }

        this.zone.run(() => {
          this.zoomLevel.set(k);
          this.updateMinimapViewport(event.transform);
        });
      });

    this.d3Svg.call(this.zoomBehavior);

    // Main group for all chart content
    this.mainGroup = this.d3Svg.append('g').attr('class', 'chart-main');

    // Global click to deselect
    this.d3Svg.on('click', (event: MouseEvent) => {
      const target = event.target as SVGElement;
      if (!target.closest('.node')) {
        this.zone.run(() => {
          this.clearSelection();
          this.hideContextMenu();
        });
      }
    });

    // Global right-click to hide context menu
    this.d3Svg.on('contextmenu', (event: MouseEvent) => {
      event.preventDefault();
    });

    // Minimap SVG (skip in embedded mode)
    if (this.minimapSvgRef) {
      this.minimapGroup = d3.select(this.minimapSvgRef.nativeElement)
        .append('g')
        .attr('class', 'minimap-group');
    }
  }

  // ── Chart render ─────────────────────────────────────────────────────────

  private renderChart(): void {
    const members = this.familyService.humanMembers();
    const pets    = this.familyService.pets();
    const layout  = this.layoutService.calculateLayout(members, pets);

    this.nodes   = layout.nodes;
    this.links   = layout.links;
    this.nodeMap = new Map(this.nodes.map(n => [n.id, n]));

    // Clear previous render
    this.mainGroup.selectAll('*').remove();
    if (this.minimapGroup) {
      this.minimapGroup.selectAll('*').remove();
    }

    // ── Render links (behind nodes) ──────────────────────────────────────
    const linksGroup = this.mainGroup.append('g').attr('class', 'links');
    for (const link of this.links) {
      renderLink(linksGroup, link, this.nodeMap);
    }

    // ── Render nodes ────────────────────────────────────────────────────
    const nodesGroup = this.mainGroup.append('g').attr('class', 'nodes');

    for (const node of this.nodes) {
      const selectedIds = this.multiSelection();
      const isSelected  =
        node.id === this.selectedMemberId() ||
        selectedIds.includes(node.id);

      if (node.type === 'human') {
        renderHumanNode(nodesGroup, node, isSelected);
      } else {
        renderPetNode(nodesGroup, node);
      }
    }

    // ── Attach interaction handlers ──────────────────────────────────────
    this.attachNodeHandlers();

    // ── Apply current view mode ──────────────────────────────────────────
    this.applyCurrentViewMode();

    // ── Render minimap (skip in embedded mode) ─────────────────────────
    if (!this.embedded && this.minimapGroup) {
      this.renderMinimap();
    }

    // Initial fit
    this.fitAll();
  }

  // ── Node event handlers ───────────────────────────────────────────────────

  private attachNodeHandlers(): void {
    const self = this;

    // Human nodes
    this.mainGroup.selectAll('.node-human')
      .on('mouseenter', function (this: SVGGElement, event: MouseEvent) {
        self.zone.run(() => {
          const id = (this as SVGGElement).getAttribute('data-member-id');
          if (!id) return;
          const member = self.familyService.humanMembers().find(m => m.id === id);
          if (!member) return;

          const conditions = member.conditions
            .filter(c => c.status === 'affected')
            .map(c => c.conditionName)
            .join(', ');

          const rect = (self.chartSvgRef.nativeElement).getBoundingClientRect();
          self.tooltipData.set({
            name: `${member.firstName} ${member.lastName}`,
            relationship: member.relationship,
            conditions,
          });
          self.tooltipX.set(event.clientX - rect.left + 12);
          self.tooltipY.set(event.clientY - rect.top - 8);
          self.tooltipVisible.set(true);

          // Highlight hover
          d3.select(this).select('rect,circle,polygon')
            .attr('filter', 'brightness(0.92)');
        });
      })
      .on('mouseleave', function (this: SVGGElement) {
        self.zone.run(() => {
          self.tooltipVisible.set(false);
          d3.select(this).select('rect,circle,polygon')
            .attr('filter', null);
        });
      })
      .on('mousemove', function (this: SVGGElement, event: MouseEvent) {
        self.zone.run(() => {
          const rect = self.chartSvgRef.nativeElement.getBoundingClientRect();
          self.tooltipX.set(event.clientX - rect.left + 12);
          self.tooltipY.set(event.clientY - rect.top - 8);
        });
      })
      .on('click', function (this: SVGGElement, event: MouseEvent) {
        event.stopPropagation();
        self.zone.run(() => {
          const id = (this as SVGGElement).getAttribute('data-member-id');
          if (!id) return;
          self.hideContextMenu();

          if (event.ctrlKey || event.metaKey) {
            // Multi-select (max 5)
            const current = self.multiSelection();
            if (current.includes(id)) {
              self.multiSelection.set(current.filter(i => i !== id));
            } else if (current.length < 5) {
              self.multiSelection.set([...current, id]);
            }
          } else {
            self.multiSelection.set([]);
            self.familyService.selectMember(id);
            self._selectedPetId.set(null);
            self.detailPanelOpen.set(true);
            self.nodeSelected.emit(id);
          }

          self.rerenderSelectionState();
          self.cdr.markForCheck();
        });
      })
      .on('dblclick', function (this: SVGGElement, event: MouseEvent) {
        event.stopPropagation();
        self.zone.run(() => {
          const id = (this as SVGGElement).getAttribute('data-member-id');
          if (!id) return;
          self.zoomToNode(id);
        });
      })
      .on('contextmenu', function (this: SVGGElement, event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        self.zone.run(() => {
          const id = (this as SVGGElement).getAttribute('data-member-id');
          if (!id) return;
          self.contextMenuTargetId = id;
          self.buildContextMenu(id);

          const rect = self.chartSvgRef.nativeElement.getBoundingClientRect();
          self.contextMenuX.set(event.clientX - rect.left);
          self.contextMenuY.set(event.clientY - rect.top);
          self.contextMenuVisible.set(true);
          self.cdr.markForCheck();
        });
      });

    // Pet nodes
    this.mainGroup.selectAll('.node-pet')
      .on('click', function (this: SVGGElement, event: MouseEvent) {
        event.stopPropagation();
        self.zone.run(() => {
          const id = (this as SVGGElement).getAttribute('data-pet-id');
          if (!id) return;
          self.familyService.selectMember(null);
          self._selectedPetId.set(id);
          self.detailPanelOpen.set(true);
          self.cdr.markForCheck();
        });
      });
  }

  // ── View mode ─────────────────────────────────────────────────────────────

  toggleLegend(): void {
    this.legendVisible.set(!this.legendVisible());
  }

  setViewMode(mode: ChartViewMode): void {
    this.viewMode.set(mode);
    this.zone.runOutsideAngular(() => this.applyCurrentViewMode());
    this.cdr.markForCheck();
  }

  private applyCurrentViewMode(): void {
    const mode    = this.viewMode();
    const members = this.familyService.humanMembers();

    switch (mode) {
      case 'genetics':
        applyGeneticsView(this.mainGroup, members);
        break;
      case 'permissions':
        applyPermissionsView(this.mainGroup, members, this.familyService.permissionMatrix());
        break;
      case 'risk': {
        const conditions = this.familyService.uniqueConditionNames();
        applyRiskView(this.mainGroup, members, [], conditions[0] ?? '');
        break;
      }
    }
  }

  // ── Zoom controls ─────────────────────────────────────────────────────────

  zoomIn(): void {
    this.zone.runOutsideAngular(() => {
      this.d3Svg.transition().duration(250)
        .call(this.zoomBehavior.scaleBy, 1.3);
    });
  }

  zoomOut(): void {
    this.zone.runOutsideAngular(() => {
      this.d3Svg.transition().duration(250)
        .call(this.zoomBehavior.scaleBy, 1 / 1.3);
    });
  }

  fitAll(): void {
    if (this.nodes.length === 0) return;
    this.zone.runOutsideAngular(() => {
      const svgEl   = this.chartSvgRef.nativeElement;
      const svgW    = svgEl.clientWidth  || 800;
      const svgH    = svgEl.clientHeight || 600;

      const xs = this.nodes.map(n => n.x);
      const ys = this.nodes.map(n => n.y);
      const x0 = Math.min(...xs) - 40;
      const y0 = Math.min(...ys) - 40;
      const x1 = Math.max(...xs.map((x, i) => x + this.nodes[i].width))  + 40;
      const y1 = Math.max(...ys.map((y, i) => y + this.nodes[i].height)) + 40;

      const cW = x1 - x0;
      const cH = y1 - y0;
      const scale = Math.min(svgW / cW, svgH / cH, 1.5);
      const tx    = (svgW - cW * scale) / 2 - x0 * scale;
      const ty    = (svgH - cH * scale) / 2 - y0 * scale;

      this.d3Svg.transition().duration(600)
        .call(
          this.zoomBehavior.transform,
          d3.zoomIdentity.translate(tx, ty).scale(scale)
        );
    });
  }

  /** Zoom in to a specific node and fade out the rest of the tree. */
  private zoomToNode(nodeId: string): void {
    const node = this.nodeMap.get(nodeId);
    if (!node) return;

    const svgEl = this.chartSvgRef.nativeElement;
    const svgW  = svgEl.clientWidth  || 800;
    const svgH  = svgEl.clientHeight || 600;
    const scale = 2.0;
    const tx    = svgW / 2 - (node.x + node.width  / 2) * scale;
    const ty    = svgH / 2 - (node.y + node.height / 2) * scale;

    // Fade other nodes
    this.mainGroup.selectAll('.node')
      .transition().duration(300)
      .attr('opacity', (d: unknown, i: number, nodes: ArrayLike<SVGGElement>) => {
        const el = nodes[i] as SVGGElement;
        return el.getAttribute('data-member-id') === nodeId ? 1 : 0.2;
      });

    this.d3Svg.transition().duration(500)
      .call(
        this.zoomBehavior.transform,
        d3.zoomIdentity.translate(tx, ty).scale(scale)
      );
  }

  // ── Selection helpers ────────────────────────────────────────────────────

  clearSelection(): void {
    this.familyService.selectMember(null);
    this._selectedPetId.set(null);
    this.multiSelection.set([]);
    this.detailPanelOpen.set(false);
    this.rerenderSelectionState();
    this.cdr.markForCheck();
  }

  closeDetailPanel(): void {
    this.detailPanelOpen.set(false);
    this.familyService.selectMember(null);
    this._selectedPetId.set(null);
  }

  private rerenderSelectionState(): void {
    const selectedId  = this.selectedMemberId();
    const multiIds    = this.multiSelection();

    this.mainGroup.selectAll('.node')
      .attr('opacity', 1);

    this.mainGroup.selectAll('.node')
      .filter(function (this: SVGGElement) {
        const id = (this as SVGGElement).getAttribute('data-member-id') ??
                   (this as SVGGElement).getAttribute('data-pet-id');
        return !!(id && (id === selectedId || multiIds.includes(id)));
      })
      .select('rect,circle,polygon')
      .attr('filter', 'drop-shadow(0 0 4px rgba(13,148,136,0.8))');

    this.mainGroup.selectAll('.node')
      .filter(function (this: SVGGElement) {
        const id = (this as SVGGElement).getAttribute('data-member-id') ??
                   (this as SVGGElement).getAttribute('data-pet-id');
        return !!(id && id !== selectedId && !multiIds.includes(id));
      })
      .select('rect,circle,polygon')
      .attr('filter', null);
  }

  // ── Context menu ─────────────────────────────────────────────────────────

  private buildContextMenu(memberId: string): void {
    const member = this.familyService.humanMembers().find(m => m.id === memberId);
    this.contextMenuItems = [
      {
        label: 'Add Partner',
        icon: 'pi pi-heart',
        action: () => {
          this.familyService.addMember({ relationship: 'spouse' });
          this.zone.runOutsideAngular(() => this.renderChart());
          this.hideContextMenu();
        },
      },
      {
        label: 'Add Child',
        icon: 'pi pi-user-plus',
        action: () => {
          this.familyService.addMember({ relationship: 'child' });
          this.zone.runOutsideAngular(() => this.renderChart());
          this.hideContextMenu();
        },
      },
      {
        label: 'Add Parent',
        icon: 'pi pi-user',
        action: () => {
          this.familyService.addMember({ relationship: 'parent' });
          this.zone.runOutsideAngular(() => this.renderChart());
          this.hideContextMenu();
        },
      },
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        action: () => {
          this.familyService.selectMember(memberId);
          this.detailPanelOpen.set(true);
          this.hideContextMenu();
          this.cdr.markForCheck();
        },
      },
      {
        label: 'Permissions',
        icon: 'pi pi-lock',
        action: () => {
          this.setViewMode('permissions');
          this.hideContextMenu();
        },
      },
      ...(member && !member.isProband
        ? [{
            label: 'Remove',
            icon: 'pi pi-trash',
            action: () => {
              this.familyService.removeMember(memberId);
              this.zone.runOutsideAngular(() => this.renderChart());
              this.hideContextMenu();
            },
          }]
        : []
      ),
    ];
  }

  hideContextMenu(): void {
    this.contextMenuVisible.set(false);
    this.contextMenuTargetId = null;
  }

  // ── Keyboard navigation ──────────────────────────────────────────────────

  onKeyDown(event: KeyboardEvent): void {
    const humanNodes = this.nodes.filter(n => n.type === 'human');
    if (humanNodes.length === 0) return;

    switch (event.key) {
      case 'Tab': {
        event.preventDefault();
        const direction = event.shiftKey ? -1 : 1;
        this.focusedNodeIndex =
          (this.focusedNodeIndex + direction + humanNodes.length) % humanNodes.length;
        const focusedNode = humanNodes[this.focusedNodeIndex];
        if (focusedNode) {
          // Scroll the node into view by panning
          this.scrollToNode(focusedNode);
          // Visual focus indicator
          this.mainGroup.selectAll('.node-human')
            .attr('stroke', null)
            .filter(function (this: SVGGElement) {
              return (this as SVGGElement).getAttribute('data-member-id') === focusedNode.id;
            })
            .raise();
        }
        break;
      }

      case 'Enter': {
        const focused = humanNodes[this.focusedNodeIndex];
        if (focused?.member) {
          this.zone.run(() => {
            this.familyService.selectMember(focused.id);
            this.detailPanelOpen.set(true);
            this.cdr.markForCheck();
          });
        }
        break;
      }

      case 'Escape':
        this.zone.run(() => {
          this.clearSelection();
          this.hideContextMenu();

          // Restore fade from double-click
          this.mainGroup.selectAll('.node')
            .transition().duration(200)
            .attr('opacity', 1);
        });
        break;
    }
  }

  private scrollToNode(node: ChartNode): void {
    const svgEl = this.chartSvgRef.nativeElement;
    const svgW  = svgEl.clientWidth  || 800;
    const svgH  = svgEl.clientHeight || 600;
    const scale = this.zoomLevel();
    const tx    = svgW / 2 - (node.x + node.width  / 2) * scale;
    const ty    = svgH / 2 - (node.y + node.height / 2) * scale;

    this.d3Svg.transition().duration(300)
      .call(
        this.zoomBehavior.transform,
        d3.zoomIdentity.translate(tx, ty).scale(scale)
      );
  }

  // ── Minimap ───────────────────────────────────────────────────────────────

  private renderMinimap(): void {
    if (this.nodes.length === 0) return;

    const MINIMAP_W = 200;
    const MINIMAP_H = 130;
    const PAD       = 10;

    const xs = this.nodes.map(n => n.x);
    const ys = this.nodes.map(n => n.y);
    const x0 = Math.min(...xs) - PAD;
    const y0 = Math.min(...ys) - PAD;
    const x1 = Math.max(...xs.map((x, i) => x + this.nodes[i].width))  + PAD;
    const y1 = Math.max(...ys.map((y, i) => y + this.nodes[i].height)) + PAD;

    const scale = Math.min(MINIMAP_W / (x1 - x0), MINIMAP_H / (y1 - y0));
    const tx    = -x0 * scale;
    const ty    = -y0 * scale;

    this.minimapGroup.attr('transform', `translate(${tx},${ty}) scale(${scale})`);

    // Draw simplified link lines
    for (const link of this.links) {
      const s = this.nodeMap.get(link.sourceId);
      const t = this.nodeMap.get(link.targetId);
      if (!s || !t) continue;
      this.minimapGroup.append('line')
        .attr('x1', s.x + s.width / 2)
        .attr('y1', s.y + s.height / 2)
        .attr('x2', t.x + t.width / 2)
        .attr('y2', t.y + t.height / 2)
        .attr('stroke', '#d1d5db')
        .attr('stroke-width', 1 / scale);
    }

    // Draw simplified node squares
    for (const node of this.nodes) {
      const isMale = node.member?.sexAtBirth === 'male';
      const color  = node.member?.avatarColor ?? '#0d9488';
      const nodeW  = node.width  * 0.7;
      const nodeH  = node.height * 0.7;
      const ox     = node.x + (node.width  - nodeW) / 2;
      const oy     = node.y + (node.height - nodeH) / 2;

      if (node.type === 'pet') {
        this.minimapGroup.append('rect')
          .attr('x', ox).attr('y', oy)
          .attr('width', nodeW).attr('height', nodeH)
          .attr('rx', 4 / scale)
          .attr('fill', color)
          .attr('opacity', 0.7);
      } else if (isMale) {
        this.minimapGroup.append('rect')
          .attr('x', ox).attr('y', oy)
          .attr('width', nodeW).attr('height', nodeH)
          .attr('fill', color)
          .attr('opacity', 0.7);
      } else {
        this.minimapGroup.append('circle')
          .attr('cx', node.x + node.width  / 2)
          .attr('cy', node.y + node.height / 2)
          .attr('r',  Math.min(nodeW, nodeH) / 2)
          .attr('fill', color)
          .attr('opacity', 0.7);
      }
    }
  }

  private updateMinimapViewport(transform: d3.ZoomTransform): void {
    const svgEl = this.chartSvgRef.nativeElement;
    const svgW  = svgEl.clientWidth  || 800;
    const svgH  = svgEl.clientHeight || 600;

    if (this.nodes.length === 0) return;

    const MINIMAP_W = 200;
    const MINIMAP_H = 130;
    const PAD       = 10;

    const xs = this.nodes.map(n => n.x);
    const ys = this.nodes.map(n => n.y);
    const x0 = Math.min(...xs) - PAD;
    const y0 = Math.min(...ys) - PAD;
    const x1 = Math.max(...xs.map((x, i) => x + this.nodes[i].width))  + PAD;
    const y1 = Math.max(...ys.map((y, i) => y + this.nodes[i].height)) + PAD;

    const scale = Math.min(MINIMAP_W / (x1 - x0), MINIMAP_H / (y1 - y0));
    const tx    = -x0 * scale;
    const ty    = -y0 * scale;

    // Transform viewport corners into content coordinates, then into minimap space
    const vx0 = (-transform.x) / transform.k;
    const vy0 = (-transform.y) / transform.k;
    const vx1 = vx0 + svgW / transform.k;
    const vy1 = vy0 + svgH / transform.k;

    const mx = vx0 * scale + tx;
    const my = vy0 * scale + ty;
    const mw = (vx1 - vx0) * scale;
    const mh = (vy1 - vy0) * scale;

    this.zone.run(() => {
      this.minimapViewport.set({
        x: Math.max(0, mx),
        y: Math.max(0, my),
        w: Math.min(mw, MINIMAP_W),
        h: Math.min(mh, MINIMAP_H),
      });
    });
  }

  // ── Export actions ────────────────────────────────────────────────────────

  private doExportSVG(): void {
    exportSVG(this.chartSvgRef.nativeElement, 'family-pedigree');
  }

  private doExportPNG(): void {
    exportPNG(this.chartSvgRef.nativeElement, 'family-pedigree');
  }

  private doExportPrint(): void {
    exportPrintableHTML(
      this.familyService.humanMembers(),
      this.familyService.familyConditions()
    );
  }

  private doExportCanRisk(): void {
    const text = exportCanRisk(this.familyService.humanMembers());
    const blob = new Blob([text], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = 'family-pedigree.canrisk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }

  private doExportPED(): void {
    const text = exportPED(this.familyService.humanMembers());
    const blob = new Blob([text], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = 'family-pedigree.ped';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }
}
