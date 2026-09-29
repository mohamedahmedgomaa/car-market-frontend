export const brandArabicMap = {
  "acura": ["أكورا", "اكورا"],
  "alfa romeo": ["ألفا روميو", "الفا روميو"],
  "aston martin": ["أستون مارتن", "استون مارتن"],
  "audi": ["أودي", "اودي"],
  "bentley": ["بنتلي"],
  "bmw": ["بي إم دبليو", "بي ام دبليو", "بي ام", "بيمر"],
  "buick": ["بويك"],
  "cadillac": ["كاديلاك", "كدلك"],
  "chevrolet": ["شيفروليه", "شفروليه", "شفر", "شيفورليه"],
  "chrysler": ["كرايسلر", "كرسلر"],
  "citroen": ["ستروين", "سيتروين"],
  "dodge": ["دوج", "دودج"],
  "ds automobiles": ["دي إس", "دي اس"],
  "ferrari": ["فيراري", "فراري"],
  "fiat": ["فيات"],
  "ford": ["فورد"],
  "genesis": ["جينيسيس", "جينسيس", "جنسيس"],
  "gmc": ["جي إم سي", "جي ام سي", "جمس"],
  "honda": ["هوندا"],
  "hummer": ["هامر"],
  "hyundai": ["هيونداي", "هينداي", "هونداي"],
  "infiniti": ["إنفينيتي", "انفنتي", "انفينيتي"],
  "isuzu": ["إيسوزو", "ايسوزو"],
  "jaguar": ["جاكوار", "جاجوار", "جاغوار"],
  "jeep": ["جيب"],
  "kia": ["كيا"],
  "lamborghini": ["لامبورجيني", "لامبورغيني", "لمبرجيني", "لمبرغيني"],
  "lancia": ["لانسيا"],
  "land rover": ["لاند روفر", "لاندروفر", "رنج روفر", "رنجروفر"],
  "lexus": ["لكزس", "لكسز"],
  "lincoln": ["لينكون", "لينكلن"],
  "maserati": ["مازيراتي", "مازراتي"],
  "mazda": ["مازدا"],
  "mercedes": ["مرسيدس", "مرسيدس بنز", "بنز"],
  "mini": ["ميني", "ميني كوبر"],
  "mitsubishi": ["ميتسوبيشي", "متسوبيشي"],
  "nissan": ["نيسان"],
  "peugeot": ["بيجو"],
  "porsche": ["بورشه", "بورش"],
  "renault": ["رينو"],
  "rolls-royce": ["رولز رويس", "رولزرويس"],
  "saab": ["ساب"],
  "seat": ["سيات"],
  "skoda": ["سكودا"],
  "subaru": ["سوبارو"],
  "suzuki": ["سوزوكي", "سزوكي"],
  "tesla": ["تيسلا", "تسلا"],
  "toyota": ["تويوتا"],
  "volkswagen": ["فولكس فاجن", "فولكس واجن", "فولكس"],
  "volvo": ["فولفو"],
  "byd": ["بي واي دي"],
  "jetour": ["جيتور"],
  "changan": ["شانجان"],
  "haval": ["هافال"],
  "mg": ["إم جي", "ام جي"],
  "jac": ["جاك"],
  "gac": ["جاك", "جي إيه سي"],
  "chery": ["شيري"],
  "baic": ["بايك"],
  "exeed": ["إكسيد", "اكسيد"],
  "hongqi": ["هونغ تشي", "هونج تشي"],
  "bestune": ["بيستون"],
  "dfsk": ["دي اف اس كي", "دفسك"],
  "lada": ["لادا"],
  "brilliance": ["بريليانس"],
  "bugatti": ["بوغاتي", "بوجاتي"],
  "mclaren": ["ماكلارين", "مكلارين"],
  "koenigsegg": ["كوينيجسيج", "كونيجسيج"],
  "pagani": ["باجاني", "باغاني"],
  "lotus": ["لوتس"],
  "harley-davidson": ["هارلي"],
  "yamaha": ["ياماها"],
  "kawasaki": ["كاواساكي", "كوزاكي"],
  "ducati": ["دوكاتي"],
  "ktm": ["كي تي إم", "كي تي ام"],
  "triumph": ["ترايمف"],
  "aprilia": ["أبريليا", "ابريليا"],
  "vespa": ["فيسبا"],
  "sym": ["إس واي إم", "اس واي ام"]
}

export const matchBrand = (brandObj, queryText) => {
  if (!brandObj) return false
  const q = String(queryText).toLowerCase().trim()
  if (!q) return true

  let nameEn = ''
  let nameAr = ''

  if (brandObj.originalName) {
    nameEn = String(brandObj.originalName.en || brandObj.originalName || '').toLowerCase().trim()
    nameAr = String(brandObj.originalName.ar || '').toLowerCase().trim()
  } else {
    nameEn = String(brandObj.name?.en || brandObj.name || '').toLowerCase().trim()
    nameAr = String(brandObj.name?.ar || '').toLowerCase().trim()
  }

  // Exact or partial match in English
  if (nameEn && (nameEn.includes(q) || q.includes(nameEn))) return true

  // Exact or partial match in Arabic (from DB, if populated and different from English)
  if (nameAr && nameAr !== nameEn && (nameAr.includes(q) || q.includes(nameAr))) return true

  // Exact or partial match in Arabic Synonyms Map
  const synonyms = brandArabicMap[nameEn]
  if (synonyms) {
    if (synonyms.some(s => s.toLowerCase().includes(q) || q.includes(s.toLowerCase()))) {
      return true
    }
  }

  return false
}

export const sortBrands = (brandsList) => {
  const popular = ['bmw', 'mercedes', 'audi', 'toyota', 'hyundai', 'kia', 'nissan', 'chevrolet', 'skoda', 'volkswagen', 'renault', 'peugeot', 'mg', 'chery'];
  return [...(brandsList || [])].sort((a, b) => {
    const aName = String(a.originalName?.en || a.originalName || a.name?.en || a.name || '').toLowerCase();
    const bName = String(b.originalName?.en || b.originalName || b.name?.en || b.name || '').toLowerCase();
    const aIndex = popular.indexOf(aName);
    const bIndex = popular.indexOf(bName);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return aName.localeCompare(bName);
  });
}

export const customBrandFilter = (value, queryText, item) => {
  const rawItem = item?.raw
  if (!rawItem) return false
  if (!queryText) return true
  return matchBrand(rawItem, queryText)
}

export const commonArabicTranslations = {
  'cairo': 'القاهرة',
  'giza': 'الجيزة',
  'alexandria': 'الإسكندرية',
  '5th settlement': 'التجمع الخامس',
  'fifth settlement': 'التجمع الخامس',
  'nasr city': 'مدينة نصر',
  'heliopolis': 'مصر الجديدة',
  'maadi': 'المعادي',
  '6th of october': '٦ أكتوبر',
  'october': 'أكتوبر',
  'sheikh zayed': 'الشيخ زايد',
  'zayed': 'الشيخ زايد',
  'new cairo': 'القاهرة الجديدة',
  'shorouk': 'الشروق',
  'madinaty': 'مدينتي',
  'obour': 'العبور',
  'badr': 'بدر',
  'rehab': 'الرحاب',
  'dokki': 'الدقي',
  'mohandessin': 'المهندسين',
  'zamalek': 'الزمالك',
  'harm': 'الهرم',
  'faisal': 'فيصل',
  '1st settlement': 'التجمع الأول',
  '3rd settlement': 'التجمع الثالث',
  'north coast': 'الساحل الشمالي',
  'hurghada': 'الغردقة',
  'sharm el sheikh': 'شرم الشيخ',
  'mansoura': 'المنصورة',
  'tanta': 'طنطا',
  'zagazig': 'الزقازيق',
  'ismailia': 'الإسماعيلية',
  'suez': 'السويس',
  'port said': 'بورسعيد',
  'alex': 'الإسكندرية',
  'qalyubia': 'القليوبية',
  'sharqia': 'الشرقية',
  'dakahlia': 'الدقهلية',
  'monufia': 'المنوفية',
  'gharbia': 'الغربية',
  'beheira': 'البحيرة',
  'damietta': 'دمياط',
  'dumyat': 'دمياط',
  'kafr el sheikh': 'كفر الشيخ',
  'fayoum': 'الفيوم',
  'beni suef': 'بني سويف',
  'minya': 'المنيا',
  'assiut': 'أسيوط',
  'sohag': 'سوهاج',
  'qena': 'قنا',
  'luxor': 'الأقصر',
  'aswan': 'أسوان',
  'red sea': 'البحر الأحمر',
  'matrouh': 'مطروح',
}

export const translateText = (val, localeStr = 'ar', parentObj = null) => {
  const isAr = (localeStr || 'ar') === 'ar'

  if (parentObj && typeof parentObj === 'object') {
    if (isAr) {
      if (parentObj.title_ar) return parentObj.title_ar
      if (parentObj.store_name_ar) return parentObj.store_name_ar
      if (parentObj.name_ar) return parentObj.name_ar
      if (parentObj.description_ar) return parentObj.description_ar
    } else {
      if (parentObj.title_en) return parentObj.title_en
      if (parentObj.store_name_en) return parentObj.store_name_en
      if (parentObj.name_en) return parentObj.name_en
      if (parentObj.description_en) return parentObj.description_en
    }
  }

  if (!val) return ''

  if (typeof val === 'object') {
    return isAr ? (val.ar || val.en || '') : (val.en || val.ar || '')
  }

  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (parsed && (parsed.ar || parsed.en)) {
          return isAr ? (parsed.ar || parsed.en || '') : (parsed.en || parsed.ar || '')
        }
      } catch {}
    }

    if (isAr) {
      const lower = trimmed.toLowerCase()
      if (brandArabicMap[lower] && brandArabicMap[lower][0]) {
        return brandArabicMap[lower][0]
      }
      if (commonArabicTranslations[lower]) {
        return commonArabicTranslations[lower]
      }
    }

    return val
  }

  return String(val)
}

