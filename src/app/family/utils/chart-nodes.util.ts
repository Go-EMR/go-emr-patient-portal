/**
 * chart-nodes.util.ts
 *
 * Pure SVG rendering helper functions for the pedigree chart.
 * These functions use the D3 selection API to append SVG elements.
 * They are NOT Angular components — they are called by the chart component's
 * D3 render cycle.
 *
 * Follows NSGC 2022 standardised pedigree symbols.
 */

import * as d3 from 'd3';
import { ChartNode, ChartLink } from '../data-access/chart-layout.service';
import { FamilyMember } from '../data-access/family.models';

// =============================================================================
// Colour helpers
// =============================================================================

/** Returns the fill colour for a member node based on their condition status. */
export function getNodeColor(member: FamilyMember): string {
  if (!member.conditions || member.conditions.length === 0) return '#ffffff';

  const affectedConditions = member.conditions.filter(c => c.status === 'affected');
  if (affectedConditions.length === 0) return '#ffffff';

  // Use the first affected condition's category colour
  return getConditionColor(affectedConditions[0].category);
}

/** Maps clinical category names to standard colours used in the pedigree. */
export function getConditionColor(category: string): string {
  const map: Record<string, string> = {
    Oncology:        '#ef4444', // red
    Cardiology:      '#f97316', // orange
    Neurology:       '#a855f7', // purple
    Endocrinology:   '#eab308', // yellow
    Hematology:      '#3b82f6', // blue
    Respiratory:     '#06b6d4', // cyan
    Gastroenterology:'#84cc16', // lime
    Immunology:      '#ec4899', // pink
    Psychiatry:      '#6366f1', // indigo
    Dermatology:     '#f59e0b', // amber
    General:         '#6b7280', // gray
  };
  return map[category] ?? '#6b7280';
}

// =============================================================================
// Human node rendering
// =============================================================================

/**
 * Renders an NSGC-compliant human pedigree node into the given D3 container.
 *
 * Symbol rules (NSGC 2022):
 *   - Male   → square (rect 40×40)
 *   - Female → circle (r = 20)
 *   - Unknown/intersex → diamond (rotated square)
 *   - Deceased → diagonal slash through the shape
 *   - Proband → arrowhead below-left
 *   - Carrier → small centre dot (r = 4)
 *   - Affected → solid fill from condition category
 *   - Multiple conditions → quadrant fills via clipPath
 *   - Adopted → square bracket lines on sides
 */
export function renderHumanNode(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  container: any,
  node: ChartNode,
  selected: boolean
): void {
  if (!node.member) return;
  const member = node.member;

  const g = container
    .append('g')
    .attr('class', `node node-human node-${member.id}`)
    .attr('transform', `translate(${node.x},${node.y})`)
    .attr('role', 'button')
    .attr('aria-label', `${member.firstName} ${member.lastName}, ${member.relationship}`)
    .attr('tabindex', 0)
    .attr('data-member-id', member.id);

  // Selection highlight ring
  if (selected) {
    g.append('circle')
      .attr('cx', 30)
      .attr('cy', 30)
      .attr('r', 34)
      .attr('fill', 'none')
      .attr('stroke', '#0d9488')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '6,3');
  }

  // ── Main shape ─────────────────────────────────────────────────────────────

  const affectedConditions = member.conditions.filter(c => c.status === 'affected');
  const isCarrier  = member.conditions.some(c => c.status === 'carrier');
  const isAffected = affectedConditions.length > 0;
  const fillColor  = isAffected ? getNodeColor(member) : '#ffffff';
  const strokeColor = member.isDeceased ? '#374151' : '#374151';

  if (member.sexAtBirth === 'male') {
    // Square
    g.append('rect')
      .attr('x', 10)
      .attr('y', 10)
      .attr('width', 40)
      .attr('height', 40)
      .attr('fill', fillColor)
      .attr('stroke', strokeColor)
      .attr('stroke-width', 1.5)
      .attr('rx', 0)
      .attr('aria-hidden', 'true');

    // Multiple condition quadrant fills
    if (affectedConditions.length > 1) {
      renderQuadrantFills(g, affectedConditions, 'rect', 10, 10, 40, 40);
    }

  } else if (member.sexAtBirth === 'female') {
    // Circle
    g.append('circle')
      .attr('cx', 30)
      .attr('cy', 30)
      .attr('r', 20)
      .attr('fill', fillColor)
      .attr('stroke', strokeColor)
      .attr('stroke-width', 1.5)
      .attr('aria-hidden', 'true');

    if (affectedConditions.length > 1) {
      renderQuadrantFills(g, affectedConditions, 'circle', 30, 30, 20, 20);
    }

  } else {
    // Diamond for unknown / intersex
    g.append('polygon')
      .attr('points', '30,6 54,30 30,54 6,30')
      .attr('fill', fillColor)
      .attr('stroke', strokeColor)
      .attr('stroke-width', 1.5)
      .attr('aria-hidden', 'true');
  }

  // ── Deceased diagonal line ─────────────────────────────────────────────────
  if (member.isDeceased) {
    g.append('line')
      .attr('x1', 6)
      .attr('y1', 54)
      .attr('x2', 54)
      .attr('y2', 6)
      .attr('stroke', '#374151')
      .attr('stroke-width', 1.5)
      .attr('aria-hidden', 'true');
  }

  // ── Carrier dot ───────────────────────────────────────────────────────────
  if (isCarrier && !isAffected) {
    g.append('circle')
      .attr('cx', 30)
      .attr('cy', 30)
      .attr('r', 4)
      .attr('fill', '#374151')
      .attr('aria-hidden', 'true');
  }

  // ── Adopted bracket lines ─────────────────────────────────────────────────
  if (member.biologicalRelation === 'adopted') {
    // Left bracket
    g.append('path')
      .attr('d', 'M 6,5 L 2,5 L 2,55 L 6,55')
      .attr('fill', 'none')
      .attr('stroke', '#374151')
      .attr('stroke-width', 1.5)
      .attr('aria-hidden', 'true');
    // Right bracket
    g.append('path')
      .attr('d', 'M 54,5 L 58,5 L 58,55 L 54,55')
      .attr('fill', 'none')
      .attr('stroke', '#374151')
      .attr('stroke-width', 1.5)
      .attr('aria-hidden', 'true');
  }

  // ── Proband arrowhead ─────────────────────────────────────────────────────
  if (member.isProband) {
    g.append('path')
      .attr('d', 'M 0,64 L 8,56 L 12,60 Z')
      .attr('fill', '#374151')
      .attr('aria-hidden', 'true');
  }

  // ── Name label ───────────────────────────────────────────────────────────
  g.append('text')
    .attr('x', 30)
    .attr('y', 72)
    .attr('text-anchor', 'middle')
    .attr('font-size', '9px')
    .attr('font-family', 'system-ui, sans-serif')
    .attr('fill', '#374151')
    .attr('class', 'node-label')
    .text(`${member.firstName} ${member.lastName}`);

  // ── Condition tag (shown at higher zoom levels, hidden by default) ─────────
  if (affectedConditions.length > 0) {
    const tagG = g.append('g')
      .attr('class', 'condition-tag')
      .attr('display', 'none'); // controlled by semantic zoom

    tagG.append('rect')
      .attr('x', 0)
      .attr('y', 80)
      .attr('width', 60)
      .attr('height', 14)
      .attr('rx', 3)
      .attr('fill', getConditionColor(affectedConditions[0].category))
      .attr('opacity', 0.85);

    tagG.append('text')
      .attr('x', 30)
      .attr('y', 91)
      .attr('text-anchor', 'middle')
      .attr('font-size', '8px')
      .attr('fill', '#ffffff')
      .text(truncate(affectedConditions[0].conditionName, 10));
  }
}

// =============================================================================
// Pet node rendering
// =============================================================================

/**
 * Renders a pet node: a teal rounded rectangle with a species icon.
 */
export function renderPetNode(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  container: any,
  node: ChartNode
): void {
  if (!node.pet) return;
  const pet = node.pet;

  const g = container
    .append('g')
    .attr('class', `node node-pet node-${pet.id}`)
    .attr('transform', `translate(${node.x},${node.y})`)
    .attr('role', 'img')
    .attr('aria-label', `${pet.name}, ${pet.species}`)
    .attr('tabindex', 0)
    .attr('data-pet-id', pet.id);

  // Rounded rect
  g.append('rect')
    .attr('x', 10)
    .attr('y', 6)
    .attr('width', 40)
    .attr('height', 28)
    .attr('rx', 6)
    .attr('fill', '#0D9488')
    .attr('stroke', '#0f766e')
    .attr('stroke-width', 1.5)
    .attr('aria-hidden', 'true');

  // Species icon (emoji / text)
  g.append('text')
    .attr('x', 30)
    .attr('y', 25)
    .attr('text-anchor', 'middle')
    .attr('font-size', '14px')
    .text(getSpeciesIcon(pet.species));

  // Pet name
  g.append('text')
    .attr('x', 30)
    .attr('y', 46)
    .attr('text-anchor', 'middle')
    .attr('font-size', '9px')
    .attr('font-family', 'system-ui, sans-serif')
    .attr('fill', '#374151')
    .attr('class', 'node-label')
    .text(pet.name);
}

// =============================================================================
// Link rendering
// =============================================================================

/**
 * Renders a single chart link (couple, descent, sibling, pet-owner).
 *
 * Link style rules:
 *   - Couple  : horizontal line (double for married/solid for partnered)
 *   - Descent : vertical drop from parent midpoint, then branching to each child
 *   - Sibling : horizontal bar above sibling nodes
 *   - Pet-owner: dashed diagonal line
 */
export function renderLink(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  container: any,
  link: ChartLink,
  nodeMap: Map<string, ChartNode>
): void {
  const source = nodeMap.get(link.sourceId);
  const target = nodeMap.get(link.targetId);
  if (!source || !target) return;

  const sx = source.x + source.width / 2;
  const sy = source.y + source.height / 2;
  const tx = target.x + target.width / 2;
  const ty = target.y + target.height / 2;

  const g = container
    .append('g')
    .attr('class', `link link-${link.type}`)
    .attr('aria-hidden', 'true');

  const strokeDash = link.style === 'dashed' ? '5,4' : 'none';

  switch (link.type) {
    case 'couple': {
      // Horizontal line between two partners at midpoint
      const midY = Math.min(sy, ty) + Math.abs(sy - ty) / 2;
      const y = source.y + source.height + 8;
      if (link.style === 'double') {
        // Double line for married
        g.append('line')
          .attr('x1', sx).attr('y1', y - 2)
          .attr('x2', tx).attr('y2', y - 2)
          .attr('stroke', '#374151').attr('stroke-width', 1.5);
        g.append('line')
          .attr('x1', sx).attr('y1', y + 2)
          .attr('x2', tx).attr('y2', y + 2)
          .attr('stroke', '#374151').attr('stroke-width', 1.5);
      } else {
        g.append('line')
          .attr('x1', sx).attr('y1', midY)
          .attr('x2', tx).attr('y2', midY)
          .attr('stroke', '#374151').attr('stroke-width', 1.5)
          .attr('stroke-dasharray', strokeDash);
      }
      break;
    }

    case 'descent': {
      // Vertical from parent bottom to child top, with elbows
      const parentBottom = source.y + source.height;
      const childTop     = target.y;
      const midY         = parentBottom + (childTop - parentBottom) / 2;

      const path = `M ${sx},${parentBottom} L ${sx},${midY} L ${tx},${midY} L ${tx},${childTop}`;
      g.append('path')
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', '#374151')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', strokeDash);
      break;
    }

    case 'sibling': {
      // Horizontal bar just above the sibling pair
      const barY = source.y - 16;
      g.append('line')
        .attr('x1', sx).attr('y1', barY)
        .attr('x2', tx).attr('y2', barY)
        .attr('stroke', '#374151').attr('stroke-width', 1.5);
      // Vertical drops to each sibling
      [source, target].forEach(n => {
        g.append('line')
          .attr('x1', n.x + n.width / 2).attr('y1', barY)
          .attr('x2', n.x + n.width / 2).attr('y2', n.y)
          .attr('stroke', '#374151').attr('stroke-width', 1.5);
      });
      break;
    }

    case 'pet-owner': {
      // Dashed line from owner to pet
      g.append('line')
        .attr('x1', sx).attr('y1', source.y + source.height)
        .attr('x2', tx).attr('y2', target.y)
        .attr('stroke', '#0D9488')
        .attr('stroke-width', 1.2)
        .attr('stroke-dasharray', '4,4');
      break;
    }
  }
}

// =============================================================================
// Internal helpers
// =============================================================================

function getSpeciesIcon(species: string): string {
  const icons: Record<string, string> = {
    dog:     '🐕',
    cat:     '🐈',
    bird:    '🐦',
    rabbit:  '🐇',
    fish:    '🐟',
    reptile: '🦎',
    other:   '🐾',
  };
  return icons[species] ?? '🐾';
}

function truncate(str: string, maxLen: number): string {
  return str.length <= maxLen ? str : str.slice(0, maxLen - 1) + '…';
}

/**
 * Renders quadrant fills when a member has multiple affected conditions.
 * Divides the node shape into up to 4 quadrants, each filled with a
 * different condition colour.
 */
function renderQuadrantFills(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  g: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  conditions: any[],
  shape: 'rect' | 'circle',
  x: number,
  y: number,
  w: number,
  h: number
): void {
  const count = Math.min(conditions.length, 4);
  const quadrants = [
    // top-left, top-right, bottom-right, bottom-left
    { dx: 0,   dy: 0,   dw: w / 2, dh: h / 2 },
    { dx: w/2, dy: 0,   dw: w / 2, dh: h / 2 },
    { dx: w/2, dy: h/2, dw: w / 2, dh: h / 2 },
    { dx: 0,   dy: h/2, dw: w / 2, dh: h / 2 },
  ];

  for (let i = 0; i < count; i++) {
    const q = quadrants[i];
    const color = getConditionColor(conditions[i].category);

    if (shape === 'circle') {
      // Use clip on a half-circle segment approximation via rect
      g.append('rect')
        .attr('x',      x - w + q.dx)
        .attr('y',      y - h + q.dy)
        .attr('width',  q.dw)
        .attr('height', q.dh)
        .attr('fill', color)
        .attr('opacity', 0.75)
        .attr('aria-hidden', 'true');
    } else {
      g.append('rect')
        .attr('x',      x + q.dx)
        .attr('y',      y + q.dy)
        .attr('width',  q.dw)
        .attr('height', q.dh)
        .attr('fill', color)
        .attr('opacity', 0.75)
        .attr('aria-hidden', 'true');
    }
  }
}
