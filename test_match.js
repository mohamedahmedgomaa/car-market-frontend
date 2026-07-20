import { matchBrand } from './src/utils/brandTranslations.js';
console.log(matchBrand({ name: 'BMW' }, 'bmw'));
console.log(matchBrand({ name: 'BMW' }, 'BMW'));
console.log(matchBrand({ name: 'BMW' }, 'بي ام دبليو'));
