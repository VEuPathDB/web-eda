import { Computation } from '../../types/visualization';
// alphadiv abundance
import { ComputationConfiguration } from '../../types/visualization';

/**
 * Creates a new `Computation` with a unique id
 */
export function createComputation(
  computationType: string,
  displayName: string,
  configuration: ComputationConfiguration,
  computations: Computation[] = [],
  computationId?: string
): Computation {
  if (!computationId) {
    computationId = createNewId(
      new Set(computations.map((c) => c.computationId))
    );
  }

  return {
    computationId,
    displayName,
    descriptor: {
      type: computationType,
      configuration,
    },
    visualizations: [],
  };
}

/**
 * Creates a new ID that is unique amongst the set of provided `ids`.
 */
function createNewId(ids: Set<string>): string {
  const id = createRandomString(5);
  if (ids.has(id)) return createNewId(ids);
  return id;
}

/**
 * Creates a random string with `numChars` characters.
 */
function createRandomString(numChars: number) {
  return Math.random()
    .toString(36)
    .slice(2, numChars + 2);
}