import { ComputationPlugin } from '../Types';
import { plugin as alphadiv } from './alphaDiv';
import { plugin as pass } from './pass';
import { plugin as distributions } from './distributions';
import { plugin as countsandproportions } from './countsandproportions';
import { plugin as xyrelationships } from './xyrelationships';

export const plugins: Record<string, ComputationPlugin> = {
  alphadiv,
  countsandproportions,
  distributions,
  pass,
  xyrelationships,
};