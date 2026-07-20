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
