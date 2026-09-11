'use client';

interface CarromFooterProps {
  whiteLeft: number;
  blackLeft: number;
  queenLeft: boolean;
  power: number;
  aiming: boolean;
  hint?: string;
}

export function CarromFooter({ whiteLeft, blackLeft, queenLeft, power, aiming, hint }: CarromFooterProps) {
  return (
    <footer className="carrom-footer">
      <div className="carrom-legend">
        <span className="carrom-legend-striker" aria-hidden />
        <div>
          <p className="carrom-legend-title">Striker</p>
          <div className="carrom-legend-coins">
            <span>
              <i className="is-white" />
              {whiteLeft}
            </span>
            <span>
              <i className="is-black" />
              {blackLeft}
            </span>
            <span>
              <i className="is-queen" />
              {queenLeft ? 1 : 0}
            </span>
          </div>
        </div>
      </div>

      <div className="carrom-power">
        <div className="carrom-power-track" aria-hidden>
          <span className="carrom-power-thumb" style={{ left: `${8 + power * 84}%` }} />
        </div>
        <p className="carrom-power-hint">
          {hint || (aiming ? 'Release to Strike' : 'Drag to Aim  •  Release to Strike')}
        </p>
      </div>

      <div className="carrom-luck">
        <span aria-hidden>☺</span>
        Good Luck!
      </div>
    </footer>
  );
}
