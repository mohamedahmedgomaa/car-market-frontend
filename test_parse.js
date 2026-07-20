import { matchBrand } from './src/utils/brandTranslations.js';
const queryText = "bmw".toLowerCase();
const brand = { id: 1, name: { ar: 'بي إم دبليو', en: 'BMW' } };
console.log(matchBrand(brand, queryText));
