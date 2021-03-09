import { preorder } from '@veupathdb/wdk-client/lib/Utils/TreeUtils';
import { useCallback } from 'react';
import { Filter } from '../types/filter';
import { usePromise } from './promise';
import { useStudyMetadata, useSubsettingClient } from './workspace';

export function useEntityCounts(filters?: Filter[]) {
  const { id, rootEntity } = useStudyMetadata();
  const subsettingClient = useSubsettingClient();
  return usePromise(
    useCallback(async () => {
      const counts: Record<string, number> = {};
      for (const entity of preorder(rootEntity, (e) => e.children ?? [])) {
        const { count } = await subsettingClient.getEntityCount(
          id,
          entity.id,
          filters ?? []
        );
        counts[entity.id] = count;
      }
      return counts;
    }, [rootEntity, subsettingClient, id, filters])
  );
}
