/*
 * Tile gradients per category. Apps in a category cycle through its set
 * in display order, so neighbours never share the exact same colour.
 */
const GRADIENTS: Record<string, [string, string][]> = {
  vpn: [['#4f8ff7', '#1d4ed8'], ['#38bdf8', '#2563eb'], ['#6366f1', '#1e40af']],
  network: [['#2dd4bf', '#0f766e'], ['#22d3ee', '#0e7490'], ['#34d399', '#047857']],
  cellular: [['#fb923c', '#c2410c'], ['#fbbf24', '#d97706'], ['#f87171', '#b91c1c']],
  system: [['#818cf8', '#4338ca'], ['#a78bfa', '#6d28d9'], ['#94a3b8', '#475569']],
  apps: [['#f472b6', '#be185d'], ['#e879f9', '#a21caf'], ['#fb7185', '#be123c']],
  kvm: [['#64748b', '#1e293b'], ['#a78bfa', '#5b21b6'], ['#38bdf8', '#0369a1']],
  firmware: [['#fbbf24', '#b45309'], ['#f97316', '#9a3412']],
  docs: [['#94a3b8', '#475569']],
};

export function gradientFor(category: string, index: number): [string, string] {
  const set = GRADIENTS[category] ?? GRADIENTS.docs;
  return set[index % set.length];
}
