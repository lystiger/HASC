type CategoryLabel = {
  vi: string;
  en: string;
};

export const CATEGORY_LABELS: Record<string, CategoryLabel> = {
  'Màng PE in, ghép, tráng keo': {
    vi: 'Màng PE in, ghép, tráng keo',
    en: 'Printed / laminated PE film with adhesive coating',
  },
  'Màng co PE - Màng CPE': {
    vi: 'Màng co PE - Màng CPE',
    en: 'PE shrink film - CPE film',
  },
  'Thiết bị phun sơn(BELL CUP/BELL DISK-NOZZLE)': {
    vi: 'Thiết bị phun sơn(BELL CUP/BELL DISK-NOZZLE)',
    en: 'Paint spray equipment (Bell Cup / Bell Disk - Nozzle)',
  },
  'Màng PE màu': {
    vi: 'Màng PE màu',
    en: 'Colored PE film',
  },
  'Túi bao gói sản phẩm': {
    vi: 'Túi bao gói sản phẩm',
    en: 'Product packaging bags',
  },
  'Hóa chất cho ngành giấy': {
    vi: 'Hóa chất cho ngành giấy',
    en: 'Paper industry chemicals',
  },
  'Lọc (FILTER) - Thiết bị': {
    vi: 'Lọc (FILTER) - Thiết bị',
    en: 'Filters (FILTER) - Equipment',
  },
};

export const getCategoryLabel = (name: string, language: string) => {
  const entry = CATEGORY_LABELS[name];
  if (!entry) {
    return name;
  }
  return language === 'vi' ? entry.vi : entry.en;
};
