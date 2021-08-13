import React, { useCallback } from 'react';
import { StudyEntity, Variable } from '../../types/study';
import { makeEntityDisplayName } from '../../utils/study-metadata';
import Switch from '@veupathdb/components/lib/components/widgets/Switch';

interface MissingDataToggleWrapperProps {
  state: boolean | undefined;
  onStateChange: (newState: boolean) => void;
  outputEntity: StudyEntity | undefined;
  overlayVariable: Variable | undefined;
}

export default function useMissingDataToggleWrapper({
  state,
  onStateChange,
  outputEntity,
  overlayVariable,
}: MissingDataToggleWrapperProps) {
  return useCallback(
    ({ children }) => {
      return (
        <div
          style={{
            border: '2px solid #f0f0f0',
            padding: '3px',
            display: 'flex',
            flexDirection: 'row',
          }}
        >
          {children}
          <Switch
            label={`Include ${
              outputEntity
                ? makeEntityDisplayName(outputEntity, true)
                : 'points'
            } with no data for selected overlay variable`}
            state={state}
            onStateChange={onStateChange}
            disabled={overlayVariable == null}
          />
        </div>
      );
    },
    [outputEntity, state, overlayVariable, onStateChange]
  );
}
