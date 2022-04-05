import { makeStyles } from '@material-ui/core';

export const useInputStyles = makeStyles({
  inputs: {
    display: 'flex',
    flexWrap: 'nowrap', // if it didn't wrap so aggressively, it would be good to allow wrapping
    // perhaps after the Material UI capitalization is removed.
    marginLeft: '0.5em', // this indent is only needed because the wdk-SaveableTextEditor above it is indented
    alignItems: 'flex-start',
  },
  inputGroup: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  input: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.5em', // in case they end up stacked vertically on a narrow screen
    marginRight: '2em',
  },
  label: {
    marginRight: '1ex',
    fontWeight: 500,
  },
  dataLabel: {
    textAlign: 'right',
    marginTop: '2em',
    fontSize: '1.35em',
    fontWeight: 500,
  },
  fullRow: {
    flexBasis: '100%',
  },
  primary: {},
  stratification: {},
  showMissingness: {},
});