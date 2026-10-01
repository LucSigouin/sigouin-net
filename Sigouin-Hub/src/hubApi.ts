/** Test and debugging hooks exposed as window.__hub. */
export interface HubApi {
  state(): string;
  bootProgress: number;
  level(): string;
  tier(): string;
  cardOpen(): boolean;
  dive(): number | null;
  diveHold(k: number | null): void;
  nearest(): string | null;
  pos(): [number, number];
  teleport(id: string): boolean;
  pauseDay(phase?: number): void;
  interactables(): { id: string; kind: string; label: string }[];
  view(p: number[] | null, l?: number[]): void;
  setVisible(name: string, on: boolean): number;
  debug(): Record<string, unknown>;
}

declare global {
  interface Window { __hub: HubApi }
}
