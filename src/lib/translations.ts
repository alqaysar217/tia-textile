
export type Language = 'ar' | 'en';

export const translations = {
  ar: {
    nav: {
      home: 'الرئيسية',
      products: 'المنتجات',
      about: 'من نحن',
      features: 'مميزاتنا',
      gallery: 'معرض الصور',
      offers: 'العروض',
      faq: 'الأسئلة الشائعة',
      contact: 'تواصل معنا',
      orderWhatsApp: 'اطلب عبر واتساب'
    },
    hero: {
      title: 'أصالة تُنسج بإتقان... وتراث يمتد عبر الأجيال',
      subtitle: 'من قلب مديرية الروضة بمحافظة شبوة، نحافظ على أصالة الصناعات النسيجية اليمنية ونقدم لكم أجود المعاوز الشعبية، بحرفية يدوية تجمع بين عراقة الماضي وروح الإبداع.',
      ctaPrimary: 'اكتشف منتجاتنا',
      ctaSecondary: 'تواصل معنا'
    },
    about: {
      title: 'عن الجمعية',
      content: 'تُعد جمعية الصناعات النسيجية للمعاوز والغزل في مديرية الروضة بمحافظة شبوة إحدى المؤسسات التعاونية التي تسهم في الحفاظ على حرفة النسيج اليمنية الأصيلة. تأسست في مارس 1973م بمشاركة 50 عضواً، بهدف حماية حرفة حياكة المعاوز اليدوية من الاندثار.',
      historyTitle: 'أكثر من 53 عاماً من الأصالة والعطاء',
      historyContent: 'منذ عام 1973، والجمعية تواصل مسيرتها في الحفاظ على حرفة النسيج اليمنية، ودعم الحرفيين، وإنتاج المعاوز الشعبية التي تعكس أصالة الهوية اليمنية.'
    },
    products: {
      title: 'اكتشف منتجاتنا',
      subtitle: 'تشكيلة من المعاوز والمنسوجات اليمنية التي تجمع بين جودة الصناعة وجمال التفاصيل.',
      viewAll: 'عرض جميع المنتجات',
      addToCart: 'أضف للسلة',
      quickView: 'عرض سريع',
      available: 'متوفر',
      outOfStock: 'غير متوفر',
      limited: 'كمية محدودة',
      soon: 'قريباً',
      search: 'ابحث عن منتج...',
      filter: 'تصفية',
      sortBy: 'ترتيب حسب'
    },
    cart: {
      title: 'سلة التسوق',
      empty: 'سلة التسوق فارغة',
      total: 'الإجمالي التقديري',
      checkout: 'إتمام الطلب عبر واتساب',
      continue: 'مواصلة التسوق'
    },
    contact: {
      title: 'تواصل معنا',
      subtitle: 'يسعدنا تواصلكم معنا',
      location: 'مديرية الروضة، محافظة شبوة، اليمن',
      phone: 'الهاتف الرئيسي',
      whatsapp: 'واتساب',
      email: 'البريد الإلكتروني'
    },
    testimonials: {
      title: 'ماذا يقول عملاؤنا؟',
      subtitle: 'نفتخر بثقة آلاف العملاء الذين اختاروا التميز والأصالة من جمعيتنا.',
      viewMore: 'عرض المزيد من الآراء'
    },
    faq: {
      title: 'الأسئلة الشائعة',
      subtitle: 'إليك بعض الإجابات على التساؤلات الأكثر تكراراً.',
      viewMore: 'عرض كافة الأسئلة'
    },
    footer: {
      description: 'جمعية الصناعات النسيجية للمعاوز والغزل – الروضة، محافظة شبوة، اليمن. نحافظ على تراثنا وننسج مستقبلنا.',
      rights: 'جميع الحقوق محفوظة © 2027'
    },
    production: {
      systemTitle: 'إدارة الإنتاج',
      cooperative: 'الجمعية النسيجية',
      dashboard: 'لوحة التحكم',
      production: 'الإنتاج',
      orders: 'أوامر الإنتاج',
      stages: 'مراحل الإنتاج',
      assignments: 'توزيع العمل',
      monitoring: 'متابعة الإنتاج',
      wip: 'الإنتاج تحت التشغيل',
      materials: 'المواد والمخازن',
      rawMaterials: 'المواد الخام',
      warehouses: 'المستودعات',
      issueVouchers: 'سندات الصرف',
      inventoryMoves: 'حركة المخزون',
      workersAndWages: 'العمال والأجور',
      workersList: 'قائمة العمال',
      departments: 'الأقسام',
      wageEntitlements: 'استحقاقات الأجور',
      vouchers: 'السندات',
      allVouchers: 'جميع السندات',
      receiptVouchers: 'استلام الإنتاج',
      transfers: 'التحويل بين الأقسام',
      reports: 'التقارير',
      productionReports: 'تقارير الإنتاج',
      costReports: 'تقارير التكاليف',
      management: 'الإدارة',
      roles: 'الأدوار والصلاحيات',
      settings: 'الإعدادات العامة',
      backToSite: 'العودة للموقع العام',
      userProfile: 'ملف المستخدم',
      logout: 'تسجيل الخروج',
      notifications: 'التنبيهات',
      searchPlaceholder: 'ابحث عن أمر إنتاج، عامل، أو سند...',
      stats: {
        totalOrders: 'إجمالي أوامر الإنتاج',
        activeOrders: 'أوامر الإنتاج النشطة',
        dailyProduction: 'الإنتاج اليومي المقبول',
        wipCount: 'الإنتاج تحت التشغيل',
        readyProducts: 'المنتجات الجاهزة',
        rawMaterialsCount: 'المواد الخام',
        activeWorkers: 'العمال النشطون',
        pendingWages: 'الأجور المستحقة'
      }
    }
  },
  en: {
    nav: {
      home: 'Home',
      products: 'Products',
      about: 'About Us',
      features: 'Features',
      gallery: 'Gallery',
      offers: 'Offers',
      faq: 'FAQ',
      contact: 'Contact Us',
      orderWhatsApp: 'Order via WhatsApp'
    },
    hero: {
      title: 'Authenticity Woven with Perfection... Heritage Spanning Generations',
      subtitle: 'From the heart of Al-Rawdah, Shabwa, we preserve authentic Yemeni textile industries, offering the finest traditional Maawiz with manual craftsmanship combining heritage and creativity.',
      ctaPrimary: 'Explore Products',
      ctaSecondary: 'Contact Us'
    },
    about: {
      title: 'About the Association',
      content: 'The Textile Industries Cooperative Association in Al-Rawdah, Shabwa, is a cooperative institution contributing to the preservation of authentic Yemeni weaving. Founded in March 1973 with 50 members.',
      historyTitle: 'Over 53 Years of Authenticity and Giving',
      historyContent: 'Since 1973, the association has continued its journey in preserving Yemeni weaving, supporting artisans, and producing traditional Maawiz reflecting Yemeni identity.'
    },
    products: {
      title: 'Discover Our Products',
      subtitle: 'A collection of Yemeni Maawiz and textiles combining quality industry and beautiful details.',
      viewAll: 'View All Products',
      addToCart: 'Add to Cart',
      quickView: 'Quick View',
      available: 'Available',
      outOfStock: 'Out of Stock',
      limited: 'Limited',
      soon: 'Soon',
      search: 'Search products...',
      filter: 'Filter',
      sortBy: 'Sort By'
    },
    cart: {
      title: 'Shopping Cart',
      empty: 'Your cart is empty',
      total: 'Estimated Total',
      checkout: 'Checkout via WhatsApp',
      continue: 'Continue Shopping'
    },
    contact: {
      title: 'Contact Us',
      subtitle: 'We are happy to hear from you',
      location: 'Al-Rawdah District, Shabwa, Yemen',
      phone: 'Main Phone',
      whatsapp: 'WhatsApp',
      email: 'Email'
    },
    testimonials: {
      title: 'What Our Customers Say',
      subtitle: 'We are proud of the trust of thousands of customers who chose excellence and authenticity.',
      viewMore: 'View More Reviews'
    },
    faq: {
      title: 'Frequently Asked Questions',
      subtitle: 'Here are answers to the most common questions.',
      viewMore: 'View All FAQs'
    },
    footer: {
      description: 'Textile Industries Cooperative Association – Al-Rawdah, Shabwa, Yemen. Preserving our heritage and weaving our future.',
      rights: 'All Rights Reserved © 2027'
    },
    production: {
      systemTitle: 'Production Management',
      cooperative: 'Textile Association',
      dashboard: 'Dashboard',
      production: 'Production',
      orders: 'Production Orders',
      stages: 'Production Stages',
      assignments: 'Work Assignments',
      monitoring: 'Production Monitoring',
      wip: 'Work In Process (WIP)',
      materials: 'Materials & Stores',
      rawMaterials: 'Raw Materials',
      warehouses: 'Warehouses',
      issueVouchers: 'Issue Vouchers',
      inventoryMoves: 'Inventory Movements',
      workersAndWages: 'Workers & Wages',
      workersList: 'Workers List',
      departments: 'Departments',
      wageEntitlements: 'Wage Entitlements',
      vouchers: 'Vouchers',
      allVouchers: 'All Vouchers',
      receiptVouchers: 'Production Receipt',
      transfers: 'Dept. Transfers',
      reports: 'Reports',
      productionReports: 'Production Reports',
      costReports: 'Cost Reports',
      management: 'Management',
      roles: 'Roles & Permissions',
      settings: 'General Settings',
      backToSite: 'Back to Main Site',
      userProfile: 'User Profile',
      logout: 'Logout',
      notifications: 'Notifications',
      searchPlaceholder: 'Search order, worker, or voucher...',
      stats: {
        totalOrders: 'Total Production Orders',
        activeOrders: 'Active Orders',
        dailyProduction: 'Accepted Daily Prod.',
        wipCount: 'Work In Process',
        readyProducts: 'Finished Goods',
        rawMaterialsCount: 'Raw Materials',
        activeWorkers: 'Active Workers',
        pendingWages: 'Pending Wages'
      }
    }
  }
};
