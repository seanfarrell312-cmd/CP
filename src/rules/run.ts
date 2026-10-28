import { MAPS } from './config';
import { MapState, createMap } from './grid';

// Everything that carries from one phase to the next within a play session (D24: memory only).
export interface RunState {
  mapIndex: number;
  map: MapState;
  day: number;
  // Scrubby's last panel; the next day redeploys here.
  px: number;
  py: number;
}

export function newRun(): RunState {
  return { mapIndex: 0, map: createMap(MAPS[0]), day: 1, px: 0, py: 0 };
}
