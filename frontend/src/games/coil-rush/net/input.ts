export interface CoilInputState {
  angle: number | null;
  boost: boolean;
}

export const createCoilInput = (): CoilInputState => ({
  angle: null,
  boost: false,
});
