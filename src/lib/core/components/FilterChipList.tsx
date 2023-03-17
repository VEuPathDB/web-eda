import FilterChip from './FilterChip';
import { StudyEntity } from '..';
import { makeStyles } from '@material-ui/core/styles';
import { Filter } from '../types/filter';
import { findEntityAndVariable } from '../utils/study-metadata';
import { ReactNode, Fragment } from 'react';
import { VariableLink, VariableLinkConfig } from './VariableLink';
import { FloatingButton } from '@veupathdb/coreui';

// Material UI CSS declarations
const useStyles = makeStyles((theme) => ({
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    '& > *:not(:last-of-type)': {
      // Spacing between chips
      marginRight: theme.spacing(),
    },
  },
}));

interface Props {
  filters?: Filter[];
  entities: Array<StudyEntity>;
  selectedEntityId?: string;
  selectedVariableId?: string;
  removeFilter: (filter: Filter) => void;
  variableLinkConfig: VariableLinkConfig;
  onRemoveAllFilters?: () => void;
}

/**
 * A list (displayed horizontally) of chips representing filters applied to
 * variables in the current analysis
 */
export default function FilterChipList(props: Props) {
  const classes = useStyles();
  const {
    filters,
    onRemoveAllFilters,
    removeFilter,
    selectedEntityId,
    selectedVariableId,
    variableLinkConfig,
  } = props;

  if (filters) {
    return (
      <div className={classes.chips}>
        {filters
          .map((filter) => {
            const { entity, variable } =
              findEntityAndVariable(props.entities, filter) ?? {};

            if (entity && variable) {
              // The string to be displayed for the filter's value
              let filterValueDisplay: ReactNode;

              // Set filterValueDisplay based on the filter's type
              switch (filter.type) {
                case 'stringSet':
                  filterValueDisplay = filter.stringSet.join(' | ');
                  break;
                case 'numberSet':
                  filterValueDisplay = filter.numberSet.join(' | ');
                  break;
                case 'dateSet':
                  filterValueDisplay = filter.dateSet.join(' | ');
                  break;
                case 'numberRange':
                case 'dateRange':
                  filterValueDisplay = `from ${filter.min} to ${filter.max}`;
                  break;
                case 'multiFilter':
                  filterValueDisplay = filter.subFilters
                    .map((subFilter) => {
                      const entAndVar = findEntityAndVariable(props.entities, {
                        entityId: filter.entityId,
                        variableId: subFilter.variableId,
                      });
                      if (entAndVar == null) return '';
                      return `${
                        entAndVar.variable.displayName
                      } = ${subFilter.stringSet.join(' | ')}`;
                    })
                    .flatMap((text, index) => (
                      <Fragment key={`filter-chip-multivalue-${text}`}>
                        {text}
                        {index < filter.subFilters.length ? <br /> : null}
                      </Fragment>
                    ));
                  break;
                default:
                  filterValueDisplay = '';
              }

              const tooltipText = (
                <>
                  <div
                    style={{
                      fontSize: '1.05em',
                      fontWeight: 700,
                      marginBottom: '.75em',
                    }}
                  >
                    {entity.displayName}: {variable.displayName}
                  </div>
                  <div>{filterValueDisplay}</div>
                </>
              );

              return (
                <FilterChip
                  tooltipText={tooltipText}
                  isActive={
                    entity.id === selectedEntityId &&
                    variable.id === selectedVariableId
                  }
                  // Remove this filter on click of X button
                  onDelete={() => removeFilter(filter)}
                  key={`filter-chip-${entity.id}-${variable.id}`}
                >
                  <VariableLink
                    entityId={entity.id}
                    variableId={variable.id}
                    replace={true}
                    linkConfig={variableLinkConfig}
                  >
                    {variable.displayName}
                  </VariableLink>
                </FilterChip>
              );
            } else {
              return null;
            }
          })
          .concat([
            onRemoveAllFilters && filters.length > 0 ? (
              <FloatingButton
                text="Remove all"
                onPress={onRemoveAllFilters}
                size="small"
                themeRole="secondary"
                textTransform="unset"
                styleOverrides={{
                  container: {
                    width: 'max-content',
                    margin: '0 10px 5px 0',
                  },
                }}
              />
            ) : null,
          ])}
      </div>
    );
  } else {
    return <></>;
  }
}
