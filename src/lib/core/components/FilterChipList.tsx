import FilterChip from './FilterChip';
import { StudyEntity } from '..';
import { VariableLink } from './VariableLink';
import { makeStyles } from '@material-ui/core/styles';
import { Filter } from '../types/filter';

// Material UI CSS declarations
const useStyles = makeStyles((theme) => ({
  root: {
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
  showValues?: boolean;
}

/**
 * A list (displayed horizontally) of chips representing filters applied to
 * variables in the current analysis
 */
export default function FilterChipList(props: Props) {
  const classes = useStyles();
  const { filters, removeFilter, selectedEntityId, selectedVariableId } = props;

  if (filters) {
    return (
      <div className={classes.root}>
        {filters.map((filter) => {
          // Get this filter's entity and variable
          const entity = props.entities.find(
            (entity) => entity.id === filter.entityId
          );
          const variable = entity?.variables.find(
            (variable) => variable.id === filter.variableId
          );

          if (entity && variable) {
            // The string to be displayed for the filter's value
            let filterValueDisplay: string;

            // Set filterValueDisplay based on the filter's type
            switch (filter.type) {
              case 'stringSet':
                filterValueDisplay = filter.stringSet.join(', ');
                break;
              case 'numberSet':
                filterValueDisplay = filter.numberSet.join(', ');
                break;
              case 'dateSet':
                filterValueDisplay = filter.dateSet.join(', ');
                break;
              case 'numberRange':
              case 'dateRange':
                filterValueDisplay = `from ${filter.min} to ${filter.max}`;
                break;
              default:
                filterValueDisplay = '';
            }

            return (
              <FilterChip
                tooltipText={filterValueDisplay}
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
                >
                  {/* {variable.displayName + props.showValues ? '\n' + filterValueDisplay : ''} */}
                  {variable.displayName}
                </VariableLink>
              </FilterChip>
            );
          } else {
            return null;
          }
        })}
      </div>
    );
  } else {
    return <></>;
  }
}
