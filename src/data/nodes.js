/**
 * The six skill-tree nodes (docs/skill_tree.md). A node is playable when its
 * question bank exists; the others show as "coming soon" once unlocked.
 */
import L1 from './questions/L1_power_rule.json';

export const NODES = [
  { id: 'L0', title: 'What is a Derivative?', subtitle: 'Tutorial', objective: 'LO1', kind: 'tutorial' },
  { id: 'L1', title: 'First Steps', subtitle: 'Power Rule', objective: 'LO2', kind: 'practice', bank: L1 },
  { id: 'L2', title: 'Side by Side', subtitle: 'Product Rule', objective: 'LO3', kind: 'practice', bank: null },
  { id: 'L3', title: 'Fair Share', subtitle: 'Quotient Rule', objective: 'LO3', kind: 'practice', bank: null },
  { id: 'L4', title: 'Inside Out', subtitle: 'Chain Rule', objective: 'LO4', kind: 'practice', bank: null },
  { id: 'L5', title: 'Boss: Rule Mixer', subtitle: 'Mixed rules', objective: 'LO5, LO6', kind: 'boss', bank: null },
];

/** locked | available | complete | comingSoon */
export function nodeStatus(node, index, progress) {
  if (progress.completed[node.id]) return 'complete';
  const previous = NODES.at(index - 1);
  const unlocked = index === 0 || Boolean(progress.completed[previous.id]);
  if (!unlocked) return 'locked';
  if (node.kind !== 'tutorial' && !node.bank) return 'comingSoon';
  return 'available';
}
