import { Injectable } from '@angular/core';
import { FamilyMember, PetProfile } from './family.models';

// =============================================================================
// Chart Layout Types
// =============================================================================

export interface ChartNode {
  id: string;
  member?: FamilyMember;
  pet?: PetProfile;
  x: number;
  y: number;
  width: number;
  height: number;
  generation: number;
  type: 'human' | 'pet';
}

export interface ChartLink {
  sourceId: string;
  targetId: string;
  type: 'couple' | 'descent' | 'sibling' | 'pet-owner';
  style: 'solid' | 'double' | 'dashed';
}

// =============================================================================
// Generation constants
// =============================================================================

const GEN_Y: Record<number, number> = {
  0: 80,    // grandparents
  1: 230,   // parents
  2: 380,   // self / siblings / spouses
  3: 530,   // children
  4: 630,   // pets
};

const NODE_W_HUMAN = 60;
const NODE_H_HUMAN = 60;
const NODE_W_PET   = 60;
const NODE_H_PET   = 40;
const H_SPACING    = 100; // minimum horizontal gap between sibling nodes
const CANVAS_MARGIN = 80;

// =============================================================================
// ChartLayoutService
// =============================================================================

@Injectable({ providedIn: 'root' })
export class ChartLayoutService {

  /**
   * Main entry point.  Takes the current list of family members and pets and
   * returns a set of positioned ChartNodes plus the connecting ChartLinks.
   */
  calculateLayout(
    members: FamilyMember[],
    pets: PetProfile[]
  ): { nodes: ChartNode[]; links: ChartLink[] } {
    const nodes: ChartNode[] = [];
    const links: ChartLink[] = [];

    // ── Bucket members by generation ────────────────────────────────────────
    const gen0 = members.filter(m => m.relationship === 'grandparent');
    const gen1 = members.filter(m => m.relationship === 'parent');
    const gen2 = members.filter(
      m => m.relationship === 'sibling' || m.relationship === 'spouse' ||
           m.relationship === 'partner' || m.isProband
    );
    const gen3 = members.filter(m => m.relationship === 'child');
    const auntsUncles = members.filter(
      m => m.relationship === 'aunt-uncle' || m.relationship === 'cousin' ||
           m.relationship === 'niece-nephew'
    );

    // Position each generation
    const gen0Nodes = this.positionGeneration(gen0, 0, CANVAS_MARGIN, nodes);
    const gen1Nodes = this.positionGeneration(gen1, 1, CANVAS_MARGIN, nodes);
    const gen2Nodes = this.positionGeneration(gen2, 2, CANVAS_MARGIN, nodes);
    const gen3Nodes = this.positionGeneration(gen3, 3, CANVAS_MARGIN, nodes);

    // Aunts/uncles placed at generation 1 (parent level), offset to the right
    const auOffset = gen1Nodes.length > 0
      ? (gen1Nodes[gen1Nodes.length - 1]?.x ?? CANVAS_MARGIN) + H_SPACING + NODE_W_HUMAN + 40
      : CANVAS_MARGIN;
    this.positionGeneration(auntsUncles, 1, auOffset, nodes);

    // Pets live at generation 4
    this.positionPets(pets, nodes);

    // ── Build links ──────────────────────────────────────────────────────────
    this.buildCoupleLinks(gen0, links);
    this.buildCoupleLinks(gen1, links);
    this.buildCoupleLinks(gen2, links);

    this.buildDescentLinks(gen1, gen0, links);
    this.buildDescentLinks(gen2, gen1, links);
    this.buildDescentLinks(gen3, gen2, links);

    this.buildSiblingLinks(gen0, links);
    this.buildSiblingLinks(gen2, links);

    this.buildPetOwnerLinks(pets, gen2, links);

    return { nodes, links };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private positionGeneration(
    members: FamilyMember[],
    generation: number,
    startX: number,
    nodes: ChartNode[]
  ): ChartNode[] {
    if (members.length === 0) return [];

    const y = GEN_Y[generation] ?? 80 + generation * 150;
    const genNodes: ChartNode[] = [];

    // Sort: proband first, then biological, then rest
    const sorted = [...members].sort((a, b) => {
      if (a.isProband) return -1;
      if (b.isProband) return 1;
      if (a.biologicalRelation === 'biological' && b.biologicalRelation !== 'biological') return -1;
      if (b.biologicalRelation === 'biological' && a.biologicalRelation !== 'biological') return 1;
      return 0;
    });

    // Group couples: for each member see if their spouse is also in same gen
    const placed = new Set<string>();
    let x = startX;

    for (const member of sorted) {
      if (placed.has(member.id)) continue;

      const node: ChartNode = {
        id: member.id,
        member,
        x,
        y,
        width: NODE_W_HUMAN,
        height: NODE_H_HUMAN,
        generation,
        type: 'human',
      };
      nodes.push(node);
      genNodes.push(node);
      placed.add(member.id);
      x += NODE_W_HUMAN + H_SPACING;
    }

    return genNodes;
  }

  private positionPets(pets: PetProfile[], nodes: ChartNode[]): void {
    const y = GEN_Y[4];
    let x = CANVAS_MARGIN;

    for (const pet of pets) {
      const node: ChartNode = {
        id: pet.id,
        pet,
        x,
        y,
        width: NODE_W_PET,
        height: NODE_H_PET,
        generation: 4,
        type: 'pet',
      };
      nodes.push(node);
      x += NODE_W_PET + H_SPACING;
    }
  }

  // ── Link builders ──────────────────────────────────────────────────────────

  /**
   * Create couple/marriage links between spouses in the same generation.
   * Heuristic: spouse/partner relationship type signals a couple bond with the proband or
   * the member they are placed next to in the same generation.
   */
  private buildCoupleLinks(
    members: FamilyMember[],
    links: ChartLink[]
  ): void {
    // Find proband in this generation
    const proband = members.find(m => m.isProband);

    for (const m of members) {
      if (m.relationship === 'spouse' || m.relationship === 'partner') {
        const targetId = proband?.id ?? members[0]?.id;
        if (targetId && targetId !== m.id) {
          // Avoid duplicates
          const exists = links.some(
            l =>
              (l.sourceId === m.id && l.targetId === targetId) ||
              (l.sourceId === targetId && l.targetId === m.id)
          );
          if (!exists) {
            links.push({
              sourceId: m.id,
              targetId,
              type: 'couple',
              style: 'double',
            });
          }
        }
      }
    }
  }

  /**
   * Create parent-to-child descent links.  Simple heuristic: children descend from
   * parents in the generation above.  We use the first couple/biological parent pair
   * as the source.
   */
  private buildDescentLinks(
    children: FamilyMember[],
    parents: FamilyMember[],
    links: ChartLink[]
  ): void {
    if (children.length === 0 || parents.length === 0) return;

    // Use first biological parent as descent source anchor
    const parent = parents.find(p => p.biologicalRelation === 'biological') ?? parents[0];
    if (!parent) return;

    for (const child of children) {
      if (child.biologicalRelation === 'biological' || child.biologicalRelation === 'adopted') {
        links.push({
          sourceId: parent.id,
          targetId: child.id,
          type: 'descent',
          style: child.biologicalRelation === 'adopted' ? 'dashed' : 'solid',
        });
      }
    }
  }

  /** Create sibling bar links among members of the same generation who share a parent. */
  private buildSiblingLinks(
    members: FamilyMember[],
    links: ChartLink[]
  ): void {
    const biologicalSiblings = members.filter(
      m => m.biologicalRelation === 'biological' && !m.isProband &&
           (m.relationship === 'sibling' || m.relationship === 'grandparent')
    );
    if (biologicalSiblings.length < 2) return;

    for (let i = 0; i < biologicalSiblings.length - 1; i++) {
      links.push({
        sourceId: biologicalSiblings[i].id,
        targetId: biologicalSiblings[i + 1].id,
        type: 'sibling',
        style: 'solid',
      });
    }
  }

  /** Create pet-owner links from each pet to the first proband/self member. */
  private buildPetOwnerLinks(
    pets: PetProfile[],
    gen2Members: FamilyMember[],
    links: ChartLink[]
  ): void {
    const owner = gen2Members.find(m => m.isProband) ?? gen2Members[0];
    if (!owner) return;

    for (const pet of pets) {
      links.push({
        sourceId: owner.id,
        targetId: pet.id,
        type: 'pet-owner',
        style: 'dashed',
      });
    }
  }
}
