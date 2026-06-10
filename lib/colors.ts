import { ColorName } from '@/types/planner';

export interface ColorConfig {
  name: ColorName;
  hex: string;
  light: string;
  dark: string;
  label: string;
}

export const COLORS: Record<ColorName, ColorConfig> = {
  purple: { name: 'purple', hex: '#7F77DD', light: '#EEEDFE', dark: '#3C3489', label: 'Focus' },
  teal:   { name: 'teal',   hex: '#1D9E75', light: '#E1F5EE', dark: '#085041', label: 'Active' },
  amber:  { name: 'amber',  hex: '#BA7517', light: '#FAEEDA', dark: '#633806', label: 'Planning' },
  coral:  { name: 'coral',  hex: '#D85A30', light: '#FAECE7', dark: '#712B13', label: 'Creative' },
  gray:   { name: 'gray',   hex: '#888780', light: '#F1EFE8', dark: '#444441', label: 'Rest' },
};

export const COLOR_LIST: ColorConfig[] = Object.values(COLORS);
