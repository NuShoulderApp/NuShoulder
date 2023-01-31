import { GetSpecies } from './species_graphql';
import { createIWDSelectField } from '../utilities/IWDSelectField';

// a class that takes a list of species as props, and lets user choose one.
// expected props:
//		- className: classes to add to output. starts with 'form-control' by default
//		- FieldProps: should be compliant with formik's field props
export const SpeciesSelector = createIWDSelectField('speciesId', 'species', 'Select a Species');

// tries to get list of species from apollo, using GetSpecies query.
export const ConnectedSpeciesSelector = createIWDSelectField('speciesId', 'species', 'Select a Species', GetSpecies, 'Species');