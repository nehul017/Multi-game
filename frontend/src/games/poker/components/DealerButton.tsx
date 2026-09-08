export function DealerButton() {
  return <span className="pk-dealer">D</span>;
}

export function BlindIndicator({ kind }: { kind: 'SB' | 'BB' }) {
  return <span className={`pk-blind is-${kind.toLowerCase()}`}>{kind}</span>;
}
