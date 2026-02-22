/**
 * chart-view-modes.util.ts
 *
 * Pure functions that apply visual modifications to D3 node selections
 * based on the current chart view mode (genetics / permissions / risk).
 * Each function takes a D3 selection of nodes and applies styling via
 * D3 transitions for smooth 300ms animations.
 */

import * as d3 from 'd3';
import { FamilyMember } from '../data-access/family.models';
import { PermissionMatrix, HeredityRiskCard } from '../data-access/family.models';
import { getConditionColor } from './chart-nodes.util';

export type ChartViewMode = 'genetics' | 'permissions' | 'risk';

// Roman numerals used for generation labels (gen 0–3)
const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV'];

// =============================================================================
// Genetics view
// =============================================================================

/**
 * Applies the standard NSGC genetics view.
 * - Restores original NSGC fill colours based on condition status
 * - Adds Roman numeral generation labels on the left side of the canvas
 * - Removes permission rings and risk overlays
 */
export function applyGeneticsView(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  svgSelection: any,
  members: FamilyMember[]
): void {
  const t = d3.transition().duration(300);

  // Remove permission rings and risk overlays
  svgSelection.selectAll('.permission-ring').remove();
  svgSelection.selectAll('.risk-overlay').remove();
  svgSelection.selectAll('.padlock-icon').remove();
  svgSelection.selectAll('.access-arrow').remove();
  svgSelection.selectAll('.risk-banner').remove();

  // Restore opacity for all nodes
  svgSelection.selectAll('.node')
    .transition(t)
    .attr('opacity', 1);

  // Restore fills: shapes get original NSGC colours
  svgSelection.selectAll('.node-human').each(function (this: SVGElement) {
    const gEl = d3.select(this);
    const memberId = gEl.attr('data-member-id');
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const affectedConditions = member.conditions.filter(c => c.status === 'affected');
    const fill = affectedConditions.length > 0
      ? getConditionColor(affectedConditions[0].category)
      : '#ffffff';

    gEl.select('rect,circle,polygon')
      .transition(t)
      .attr('fill', fill);
  });

  // Add Roman numeral generation labels
  svgSelection.selectAll('.gen-label').remove();
  const generationYPositions: Record<number, number> = { 0: 80, 1: 230, 2: 380, 3: 530 };
  Object.entries(generationYPositions).forEach(([gen, yPos]) => {
    svgSelection.append('text')
      .attr('class', 'gen-label')
      .attr('x', 20)
      .attr('y', yPos + 30)
      .attr('font-size', '13px')
      .attr('font-weight', '700')
      .attr('fill', '#6b7280')
      .attr('font-style', 'italic')
      .text(ROMAN_NUMERALS[parseInt(gen)]);
  });
}

// =============================================================================
// Permissions view
// =============================================================================

/**
 * Applies the permissions view overlay.
 * - Coloured outer ring on each human node based on access level:
 *     green  = full
 *     amber  = partial
 *     red    = none
 *     gray   = no data
 *     dashed blue = emergency-only
 * - Padlock icon on restricted (none) nodes
 * - Removes genetics and risk overlays
 */
export function applyPermissionsView(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  svgSelection: any,
  members: FamilyMember[],
  matrix: PermissionMatrix[]
): void {
  const t = d3.transition().duration(300);

  // Remove genetics and risk overlays
  svgSelection.selectAll('.gen-label').remove();
  svgSelection.selectAll('.risk-overlay').remove();
  svgSelection.selectAll('.risk-banner').remove();

  // Reset fills to white so the ring is the primary indicator
  svgSelection.selectAll('.node-human').each(function (this: SVGElement) {
    const gEl = d3.select(this);
    gEl.select('rect,circle,polygon')
      .transition(t)
      .attr('fill', '#f9fafb');
  });

  // Remove existing rings
  svgSelection.selectAll('.permission-ring').remove();
  svgSelection.selectAll('.padlock-icon').remove();

  // Add permission rings for each member
  svgSelection.selectAll('.node-human').each(function (this: SVGElement) {
    const gEl = d3.select(this);
    const memberId = gEl.attr('data-member-id');
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const ringColor = getAccessLevelColor(member.accessLevel);
    const isDashed  = member.accessLevel === 'emergency-only';
    const cx = 30;
    const cy = 30;
    const r  = 28;

    gEl.append('circle')
      .attr('class', 'permission-ring')
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('r', r)
      .attr('fill', 'none')
      .attr('stroke', ringColor)
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', isDashed ? '6,3' : 'none')
      .attr('opacity', 0)
      .transition(t)
      .attr('opacity', 1);

    // Padlock on restricted nodes
    if (member.accessLevel === 'none') {
      gEl.append('text')
        .attr('class', 'padlock-icon')
        .attr('x', 30)
        .attr('y', 18)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .text('🔒')
        .attr('opacity', 0)
        .transition(t)
        .attr('opacity', 1);
    }

    // Directional access arrow for partial/full members
    if (member.accessLevel === 'full' || member.accessLevel === 'partial') {
      gEl.append('text')
        .attr('class', 'access-arrow')
        .attr('x', 30)
        .attr('y', -6)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', ringColor)
        .text('↕')
        .attr('opacity', 0)
        .transition(t)
        .attr('opacity', 1);
    }
  });
}

// =============================================================================
// Risk view
// =============================================================================

/**
 * Applies the hereditary risk view overlay.
 * - Colours each node by risk level for the selected condition
 * - Adds an inheritance pattern banner at the top of the SVG
 * - Removes genetics and permissions overlays
 */
export function applyRiskView(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  svgSelection: any,
  members: FamilyMember[],
  riskCards: HeredityRiskCard[],
  selectedCondition: string
): void {
  const t = d3.transition().duration(300);

  // Remove other overlays
  svgSelection.selectAll('.gen-label').remove();
  svgSelection.selectAll('.permission-ring').remove();
  svgSelection.selectAll('.padlock-icon').remove();
  svgSelection.selectAll('.access-arrow').remove();
  svgSelection.selectAll('.risk-overlay').remove();
  svgSelection.selectAll('.risk-banner').remove();

  const riskCard = riskCards.find(r => r.conditionName === selectedCondition);

  // Colour each node by risk level
  svgSelection.selectAll('.node-human').each(function (this: SVGElement) {
    const gEl = d3.select(this);
    const memberId = gEl.attr('data-member-id');
    const member   = members.find(m => m.id === memberId);
    if (!member) return;

    let riskLevel: 'high' | 'moderate' | 'low' | 'unknown' = 'unknown';

    if (selectedCondition) {
      const hasCondition = member.conditions.some(
        c => c.conditionName === selectedCondition && c.status === 'affected'
      );
      const isCarrier = member.conditions.some(
        c => c.conditionName === selectedCondition && c.status === 'carrier'
      );

      if (hasCondition) {
        riskLevel = 'high';
      } else if (isCarrier) {
        riskLevel = 'moderate';
      } else if (riskCard?.affectedRelatives.length) {
        riskLevel = 'low';
      }
    }

    const riskFill = getRiskColor(riskLevel);

    gEl.select('rect,circle,polygon')
      .transition(t)
      .attr('fill', riskFill);

    // Risk overlay badge
    gEl.append('rect')
      .attr('class', 'risk-overlay')
      .attr('x', 44)
      .attr('y', 4)
      .attr('width', 14)
      .attr('height', 14)
      .attr('rx', 7)
      .attr('fill', riskFill)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('opacity', 0)
      .transition(t)
      .attr('opacity', 1);
  });

  // Inheritance pattern banner at top
  if (riskCard) {
    svgSelection.append('rect')
      .attr('class', 'risk-banner')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', '100%')
      .attr('height', 28)
      .attr('fill', '#f0fdf4')
      .attr('opacity', 0.92);

    svgSelection.append('text')
      .attr('class', 'risk-banner')
      .attr('x', 20)
      .attr('y', 18)
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#166534')
      .text(`${selectedCondition} — ${riskCard.inheritancePattern} | Risk: ${riskCard.riskLevel}`);
  }
}

// =============================================================================
// Colour helpers
// =============================================================================

function getAccessLevelColor(level: string): string {
  const map: Record<string, string> = {
    full:            '#16a34a', // green
    partial:         '#d97706', // amber
    none:            '#dc2626', // red
    'emergency-only':'#2563eb', // blue
  };
  return map[level] ?? '#9ca3af'; // gray for no data
}

function getRiskColor(level: 'high' | 'moderate' | 'low' | 'unknown'): string {
  const map: Record<string, string> = {
    high:     '#fecaca', // light red
    moderate: '#fed7aa', // light orange
    low:      '#bbf7d0', // light green
    unknown:  '#f3f4f6', // light gray
  };
  return map[level] ?? '#f3f4f6';
}
