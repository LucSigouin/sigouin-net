export type BuildingId = 'computer-lab' | 'music-studio' | 'office' | 'ai-workspace';

export const BUILDING_IDS: BuildingId[] = ['computer-lab', 'music-studio', 'office', 'ai-workspace'];

export interface Entry {
  title: string;
  blurb: string;
  url: string | null;
  image: string | null;
  exhibit: string;
  /** Short line under the title on a lab screen. */
  tag?: string;
}

export interface BuildingContent {
  name: string;
  theme: string;
  intro: string;
  entries: Entry[];
}

export interface Content {
  buildings: Record<BuildingId, BuildingContent>;
}
