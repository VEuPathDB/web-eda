import { StudyVariable } from '../../types/study';

export interface HistogramVariable extends StudyVariable {
  type: 'number' | 'date';
  dataShape: 'continuous';
}

export interface TableVariable extends StudyVariable {
  type: 'string' | 'number' | 'date';
  dataShape: 'categorical' | 'binary' | 'ordinal';
}
