import { FolioSettings, FolioPosition, NumberingType, FolioDirection } from './types';

export const INITIAL_SETTINGS: FolioSettings = {
  startNumber: 1,
  direction: FolioDirection.Ascending,
  type: NumberingType.Numeric,
  format: "{n}",
  position: FolioPosition.TopRight,
  pageOrientation: 'vertical', // Default requested by user
  marginX: 20,
  marginY: 20,
  fontSize: 12,
  fontFamily: 'Helvetica',
  color: '#FF0000',
  opacity: 1,
  rotation: 0,
  bold: true,
  italic: false,
  backgroundColor: 'transparent',
  excludePages: []
};

export const AVAILABLE_FONTS = [
  { label: 'Helvetica (Estándar)', value: 'Helvetica' },
  { label: 'Times Roman (Estándar)', value: 'Times-Roman' },
  { label: 'Courier (Estándar)', value: 'Courier' },
  // In a real app with fontkit, we could allow uploads
];

export const PRESETS = [
  { name: 'Simple (Sup. Der.)', template: '{n}' },
  { name: 'Expediente', template: 'Exp. 2024 / {n}' },
  { name: 'Folio Oficial', template: 'FOLIO: 00{n}' },
];
