import { StudyEntity } from '../../types/study';
import { leastAncestralEntity } from '../../utils/data-element-constraints';
import { entityTreeToArray } from '../../utils/study-metadata';

const mockStudyTree: StudyEntity = {
  id: 'root',
  idColumnName: 'colname',
  displayName: 'nice label',
  description: 'none',
  variables: [],
  children: [
    {
      id: 'branchA',
      idColumnName: 'colname',
      displayName: 'nice label',
      description: 'none',
      variables: [],
      children: [
        {
          id: 'leafA1',
          idColumnName: 'colname',
          displayName: 'nice label',
          description: 'none',
          variables: [],
        },
        {
          id: 'leafA2',
          idColumnName: 'colname',
          displayName: 'nice label',
          description: 'none',
          variables: [],
        },
      ],
    },
    {
      id: 'branchB',
      idColumnName: 'colname',
      displayName: 'nice label',
      description: 'none',
      variables: [],
      children: [
        {
          id: 'leafB1',
          idColumnName: 'colname',
          displayName: 'nice label',
          description: 'none',
          variables: [],
        },
        {
          id: 'leafB2',
          idColumnName: 'colname',
          displayName: 'nice label',
          description: 'none',
          variables: [],
        },
      ],
    },
  ],
};

const studyEntities = entityTreeToArray(mockStudyTree);

const branchA = studyEntities.find((e) => (e.id = 'branchA'))!;
const branchB = studyEntities.find((e) => (e.id = 'branchB'))!;
const leafA1 = studyEntities.find((e) => (e.id = 'leafA1'))!;
const leafA2 = studyEntities.find((e) => (e.id = 'leafA2'))!;
const leafB1 = studyEntities.find((e) => (e.id = 'leafB1'))!;
const leafB2 = studyEntities.find((e) => (e.id = 'leafB2'))!;

describe('leastAncestralEntity', () => {
  it('should find leafA1 to be least ancestral in [branchA, leafA1]', () => {
    expect(leastAncestralEntity([branchA, leafA1], studyEntities)).toEqual(
      leafA1
    );
  });
});
