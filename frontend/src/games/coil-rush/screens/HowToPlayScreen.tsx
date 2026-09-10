'use client';

interface HowToPlayScreenProps {
  onBack: () => void;
}

const TIPS = [
  { title: 'Steer', body: 'Move the mouse, drag on mobile, or use WASD / arrow keys. Your coil always slides forward.' },
  { title: 'Grow', body: 'Eat fruit (apple, orange, berries, banana) and fast food (burger, pizza, fries, soda). Combos raise your score if you keep collecting.' },
  { title: 'Boost', body: 'Hold Space, click, or the BOOST button. It is faster, but spends energy and a little length.' },
  { title: 'Survive', body: 'Hit another coil’s body and you are eliminated. Cut rivals with your own body to score big.' },
  { title: 'Powers', body: 'Speed, Magnet, Shield, Ghost, and 2x Multiplier spawn as rare orbs. They expire automatically.' },
];

export function HowToPlayScreen({ onBack }: HowToPlayScreenProps) {
  return (
    <section className="coil-screen">
      <button type="button" className="coil-back" onClick={onBack}>
        Back
      </button>
      <h2>How to play</h2>
      <p className="coil-empty">Grow your coil, outsmart rivals, and survive. Classic free play has no time limit.</p>
      <ol className="coil-howto">
        {TIPS.map((tip) => (
          <li key={tip.title}>
            <strong>{tip.title}</strong>
            <p>{tip.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
