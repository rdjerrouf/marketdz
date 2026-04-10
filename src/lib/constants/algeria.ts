// Algeria-specific constants
// src/lib/constants/algeria.ts
//
// IMPORTANT — data integrity rule:
// Every entry in `cities` must have a matching entry at the SAME INDEX in nameAr and nameFr.
// TypeScript enforces this via the City interface. Never add to one without the other.

export interface City {
  name: string    // Latin key — this is what gets stored in the database
  nameAr: string  // Arabic display name
  nameFr: string  // French display name (often same as name, but explicit)
}

export interface Wilaya {
  code: string
  name: string    // Latin/romanized key
  nameAr: string  // Arabic display name
  nameFr: string  // French display name
  cities: City[]
}

// Locale-aware display helper — use this everywhere instead of inline ternaries
export function getLocalizedName(
  item: { name: string; nameAr: string; nameFr: string },
  locale: string
): string {
  if (locale === 'ar') return item.nameAr
  if (locale === 'fr') return item.nameFr
  return item.name
}

// All 58 wilayas of Algeria with trilingual city names
export const ALGERIA_WILAYAS: Wilaya[] = [
  {
    code: '01', name: 'Adrar', nameAr: 'أدرار', nameFr: 'Adrar',
    cities: [
      { name: 'Adrar', nameAr: 'أدرار', nameFr: 'Adrar' },
      { name: 'Timimoun', nameAr: 'تيميمون', nameFr: 'Timimoun' },
      { name: 'Aoulef', nameAr: 'أولف', nameFr: 'Aoulef' },
      { name: 'Reggane', nameAr: 'رقان', nameFr: 'Reggane' },
      { name: 'Inzegmir', nameAr: 'إنزغمير', nameFr: 'Inzegmir' },
      { name: 'Tit', nameAr: 'تيت', nameFr: 'Tit' },
      { name: 'Ksar Kaddour', nameAr: 'قصر قدور', nameFr: 'Ksar Kaddour' },
      { name: 'Tsabit', nameAr: 'ثابت', nameFr: 'Tsabit' },
      { name: 'Fenoughil', nameAr: 'فنوغيل', nameFr: 'Fenoughil' },
      { name: 'Zaouiet Kounta', nameAr: 'زاوية كنتة', nameFr: 'Zaouiet Kounta' },
    ],
  },
  {
    code: '02', name: 'Chlef', nameAr: 'الشلف', nameFr: 'Chlef',
    cities: [
      { name: 'Chlef', nameAr: 'الشلف', nameFr: 'Chlef' },
      { name: 'Tenès', nameAr: 'تنس', nameFr: 'Tenès' },
      { name: 'Beni Haoua', nameAr: 'بني حواء', nameFr: 'Béni Haoua' },
      { name: 'El Karimia', nameAr: 'الكريمية', nameFr: 'El Karimia' },
      { name: 'Sobha', nameAr: 'صبحة', nameFr: 'Sobha' },
      { name: 'Harchoun', nameAr: 'هارشون', nameFr: 'Harchoun' },
      { name: 'Ouled Fares', nameAr: 'أولاد فارس', nameFr: 'Ouled Fares' },
      { name: 'Boukadir', nameAr: 'بوقادير', nameFr: 'Boukadir' },
      { name: 'Oued Sly', nameAr: 'وادي سلي', nameFr: 'Oued Sly' },
      { name: 'Abou El Hassan', nameAr: 'أبو الحسن', nameFr: 'Abou El Hassan' },
    ],
  },
  {
    code: '03', name: 'Laghouat', nameAr: 'الأغواط', nameFr: 'Laghouat',
    cities: [
      { name: 'Laghouat', nameAr: 'الأغواط', nameFr: 'Laghouat' },
      { name: 'Aflou', nameAr: 'أفلو', nameFr: 'Aflou' },
      { name: 'Ksar El Hirane', nameAr: 'قصر الحيران', nameFr: 'Ksar El Hirane' },
      { name: 'Brida', nameAr: 'بريدة', nameFr: 'Brida' },
      { name: 'Gueltat Sidi Saad', nameAr: 'قلتة سيدي سعد', nameFr: 'Gueltat Sidi Saad' },
      { name: 'Ain Madhi', nameAr: 'عين ماضي', nameFr: 'Aïn Mahdi' },
      { name: 'Tadjemout', nameAr: 'تاجموت', nameFr: 'Tadjemout' },
      { name: 'Oued Morra', nameAr: 'وادي مرة', nameFr: 'Oued Morra' },
      { name: 'Hassi Delaa', nameAr: 'حاسي دلاعة', nameFr: 'Hassi Delaa' },
      { name: "Hassi R'Mel", nameAr: 'حاسي الرمل', nameFr: "Hassi R'Mel" },
    ],
  },
  {
    code: '04', name: 'Oum El Bouaghi', nameAr: 'أم البواقي', nameFr: 'Oum El Bouaghi',
    cities: [
      { name: 'Oum El Bouaghi', nameAr: 'أم البواقي', nameFr: 'Oum El Bouaghi' },
      { name: 'Ain Beida', nameAr: 'عين البيضاء', nameFr: 'Aïn Beïda' },
      { name: 'Ain MLila', nameAr: 'عين مليلة', nameFr: 'Aïn M\'Lila' },
      { name: 'Behir Chergui', nameAr: 'بحير الشرقي', nameFr: 'Behir Chergui' },
      { name: 'El Amiria', nameAr: 'الأميرية', nameFr: 'El Amiria' },
      { name: 'Sigus', nameAr: 'سيقوس', nameFr: 'Sigus' },
      { name: 'Ain Fakroun', nameAr: 'عين فكرون', nameFr: 'Aïn Fakroun' },
      { name: 'Ain Kercha', nameAr: 'عين كرشة', nameFr: 'Aïn Kercha' },
      { name: 'Meskiana', nameAr: 'مسكيانة', nameFr: 'Meskiana' },
      { name: 'Ain Babouche', nameAr: 'عين بابوش', nameFr: 'Aïn Babouche' },
    ],
  },
  {
    code: '05', name: 'Batna', nameAr: 'باتنة', nameFr: 'Batna',
    cities: [
      { name: 'Batna', nameAr: 'باتنة', nameFr: 'Batna' },
      { name: 'Barika', nameAr: 'بريكة', nameFr: 'Barika' },
      { name: 'Arris', nameAr: 'أريس', nameFr: 'Arris' },
      { name: 'Ain Touta', nameAr: 'عين توتة', nameFr: 'Aïn Touta' },
      { name: 'Merouana', nameAr: 'مروانة', nameFr: 'Merouana' },
      { name: 'El Madher', nameAr: 'المادر', nameFr: 'El Madher' },
      { name: 'Tazoult', nameAr: 'تازولت', nameFr: 'Tazoult' },
      { name: 'Ngaous', nameAr: 'ڤاوس', nameFr: 'N\'Gaous' },
      { name: 'Menaa', nameAr: 'مناع', nameFr: 'Menaa' },
      { name: 'Ras El Aioun', nameAr: 'رأس العيون', nameFr: 'Ras El Aïoun' },
    ],
  },
  {
    code: '06', name: 'Béjaïa', nameAr: 'بجاية', nameFr: 'Béjaïa',
    cities: [
      { name: 'Béjaïa', nameAr: 'بجاية', nameFr: 'Béjaïa' },
      { name: 'Akbou', nameAr: 'أقبو', nameFr: 'Akbou' },
      { name: 'Kherrata', nameAr: 'خراطة', nameFr: 'Kherrata' },
      { name: 'Sidi Aich', nameAr: 'سيدي عيش', nameFr: 'Sidi Aïch' },
      { name: 'Amizour', nameAr: 'أميزور', nameFr: 'Amizour' },
      { name: 'Barbacha', nameAr: 'برباشة', nameFr: 'Barbacha' },
      { name: 'Tazmalt', nameAr: 'تازمالت', nameFr: 'Tazmalt' },
      { name: 'Tichy', nameAr: 'تيشي', nameFr: 'Tichy' },
      { name: 'Seddouk', nameAr: 'صدوق', nameFr: 'Seddouk' },
      { name: 'Aokas', nameAr: 'أوقاس', nameFr: 'Aokas' },
    ],
  },
  {
    code: '07', name: 'Biskra', nameAr: 'بسكرة', nameFr: 'Biskra',
    cities: [
      { name: 'Biskra', nameAr: 'بسكرة', nameFr: 'Biskra' },
      { name: 'Sidi Okba', nameAr: 'سيدي عقبة', nameFr: 'Sidi Okba' },
      { name: 'Ouled Djellal', nameAr: 'أولاد جلال', nameFr: 'Ouled Djellal' },
      { name: 'El Kantara', nameAr: 'القنطرة', nameFr: 'El Kantara' },
      { name: 'Tolga', nameAr: 'طولقة', nameFr: 'Tolga' },
      { name: 'Foughala', nameAr: 'فوغالة', nameFr: 'Foughala' },
      { name: 'Lichana', nameAr: 'لشانة', nameFr: 'Lichana' },
      { name: 'Zeribet El Oued', nameAr: 'زريبة الوادي', nameFr: 'Zeribet El Oued' },
      { name: 'Sidi Khaled', nameAr: 'سيدي خالد', nameFr: 'Sidi Khaled' },
      { name: 'El Outaya', nameAr: 'الوطاية', nameFr: 'El Outaya' },
    ],
  },
  {
    code: '08', name: 'Béchar', nameAr: 'بشار', nameFr: 'Béchar',
    cities: [
      { name: 'Béchar', nameAr: 'بشار', nameFr: 'Béchar' },
      { name: 'Kenadsa', nameAr: 'قنادسة', nameFr: 'Kenadsa' },
      { name: 'Abadla', nameAr: 'عبادلة', nameFr: 'Abadla' },
      { name: 'Beni Ounif', nameAr: 'بني ونيف', nameFr: 'Béni Ounif' },
      { name: 'Igli', nameAr: 'إيقلي', nameFr: 'Igli' },
      { name: 'Taghit', nameAr: 'تاغيت', nameFr: 'Taghit' },
      { name: 'Ouled Khoudir', nameAr: 'أولاد خضير', nameFr: 'Ouled Khoudir' },
      { name: 'Meridja', nameAr: 'مريجة', nameFr: 'Meridja' },
      { name: 'El Ouata', nameAr: 'الواطة', nameFr: 'El Ouata' },
      { name: 'Lahmar', nameAr: 'لحمر', nameFr: 'Lahmar' },
    ],
  },
  {
    code: '09', name: 'Blida', nameAr: 'البليدة', nameFr: 'Blida',
    cities: [
      { name: 'Blida', nameAr: 'البليدة', nameFr: 'Blida' },
      { name: 'Boufarik', nameAr: 'بوفاريك', nameFr: 'Boufarik' },
      { name: 'Benchabane', nameAr: 'بن شعبان', nameFr: 'Benchabane' },
      { name: 'Larbaa', nameAr: 'لاربعاء', nameFr: 'Larbaa' },
      { name: 'Bougara', nameAr: 'بوقرة', nameFr: 'Bougara' },
      { name: 'Ouled Yaich', nameAr: 'أولاد يعيش', nameFr: 'Ouled Yaïch' },
      { name: 'Chebli', nameAr: 'الشبلي', nameFr: 'Chebli' },
      { name: 'Mouzaia', nameAr: 'موزاية', nameFr: 'Mouzaia' },
      { name: 'Souma', nameAr: 'الصومعة', nameFr: 'Souma' },
      { name: 'Bouinan', nameAr: 'بوينان', nameFr: 'Bouïnan' },
      { name: 'Meftah', nameAr: 'مفتاح', nameFr: 'Meftah' },
    ],
  },
  {
    code: '10', name: 'Bouira', nameAr: 'البويرة', nameFr: 'Bouira',
    cities: [
      { name: 'Bouira', nameAr: 'البويرة', nameFr: 'Bouira' },
      { name: 'Lakhdaria', nameAr: 'الأخضرية', nameFr: 'Lakhdaria' },
      { name: 'Sour El Ghouzlane', nameAr: 'سور الغزلان', nameFr: 'Sour El Ghouzlane' },
      { name: 'Ain Bessem', nameAr: 'عين بسام', nameFr: 'Aïn Bessem' },
      { name: 'Birghbalou', nameAr: 'بئر غبالو', nameFr: 'Birghbalou' },
      { name: 'Kadiria', nameAr: 'القديرية', nameFr: 'Kadiria' },
      { name: 'Aomar', nameAr: 'عومر', nameFr: 'Aomar' },
      { name: 'Haizer', nameAr: 'حيزر', nameFr: 'Haïzer' },
      { name: 'Bordj Oukhriss', nameAr: 'برج أوخريص', nameFr: 'Bordj Oukhriss' },
      { name: 'Bechloul', nameAr: 'بشلول', nameFr: 'Bechloul' },
    ],
  },
  {
    code: '11', name: 'Tamanrasset', nameAr: 'تمنراست', nameFr: 'Tamanrasset',
    cities: [
      { name: 'Tamanrasset', nameAr: 'تمنراست', nameFr: 'Tamanrasset' },
      { name: 'In Guezzam', nameAr: 'إن قزام', nameFr: 'In Guezzam' },
      { name: 'Tin Zaouaten', nameAr: 'تين زاواتين', nameFr: 'Tin Zaouaten' },
      { name: 'In Salah', nameAr: 'عين صالح', nameFr: 'In Salah' },
      { name: 'Foggaret Ezzaouia', nameAr: 'فقارة الزاوية', nameFr: 'Foggaret Ezzaouia' },
      { name: 'Abalessa', nameAr: 'أبلسة', nameFr: 'Abalessa' },
      { name: 'In Amguel', nameAr: 'إن أمقل', nameFr: 'In Amguel' },
      { name: 'Tazrouk', nameAr: 'تازروك', nameFr: 'Tazrouk' },
      { name: 'Idles', nameAr: 'إيدلس', nameFr: 'Idles' },
      { name: 'In Ghar', nameAr: 'إن غار', nameFr: 'In Ghar' },
    ],
  },
  {
    code: '12', name: 'Tébessa', nameAr: 'تبسة', nameFr: 'Tébessa',
    cities: [
      { name: 'Tébessa', nameAr: 'تبسة', nameFr: 'Tébessa' },
      { name: 'Cheria', nameAr: 'الشريعة', nameFr: 'Cheria' },
      { name: 'El Aouinet', nameAr: 'العوينات', nameFr: 'El Aouinet' },
      { name: 'Bir El Ater', nameAr: 'بئر العاتر', nameFr: 'Bir El Ater' },
      { name: 'El Ogla', nameAr: 'العقلة', nameFr: 'El Ogla' },
      { name: 'Negrine', nameAr: 'نقرين', nameFr: 'Négrine' },
      { name: 'El Houidjbet', nameAr: 'الحويجبات', nameFr: 'El Houidjbet' },
      { name: 'Ouenza', nameAr: 'ونزة', nameFr: 'Ouenza' },
      { name: 'El Kouif', nameAr: 'الكويف', nameFr: 'El Kouif' },
      { name: 'Hammamet', nameAr: 'حمام', nameFr: 'Hammamet' },
    ],
  },
  {
    code: '13', name: 'Tlemcen', nameAr: 'تلمسان', nameFr: 'Tlemcen',
    cities: [
      { name: 'Tlemcen', nameAr: 'تلمسان', nameFr: 'Tlemcen' },
      { name: 'Maghnia', nameAr: 'مغنية', nameFr: 'Maghnia' },
      { name: 'Nedroma', nameAr: 'ندرومة', nameFr: 'Nedroma' },
      { name: 'Remchi', nameAr: 'رمشي', nameFr: 'Remchi' },
      { name: 'Sebdou', nameAr: 'سبدو', nameFr: 'Sebdou' },
      { name: 'Ghazaouet', nameAr: 'الغزوات', nameFr: 'Ghazaouet' },
      { name: 'Marsa Ben Mhidi', nameAr: 'مرسى بن مهيدي', nameFr: 'Marsa Ben M\'Hidi' },
      { name: 'Hennaya', nameAr: 'هنين', nameFr: 'Hennaya' },
      { name: 'Bensekrane', nameAr: 'بن سكران', nameFr: 'Bensekrane' },
      { name: 'Ouled Mimoun', nameAr: 'أولاد ميمون', nameFr: 'Ouled Mimoun' },
    ],
  },
  {
    code: '14', name: 'Tiaret', nameAr: 'تيارت', nameFr: 'Tiaret',
    cities: [
      { name: 'Tiaret', nameAr: 'تيارت', nameFr: 'Tiaret' },
      { name: 'Sougueur', nameAr: 'سوقر', nameFr: 'Sougueur' },
      { name: 'Mahdia', nameAr: 'المهدية', nameFr: 'Mahdia' },
      { name: 'Medroussa', nameAr: 'مدروسة', nameFr: 'Medroussa' },
      { name: 'Frenda', nameAr: 'فرندة', nameFr: 'Frenda' },
      { name: 'Ain Deheb', nameAr: 'عين الدهب', nameFr: 'Aïn Deheb' },
      { name: 'Ksar Chellala', nameAr: 'قصر الشلالة', nameFr: 'Ksar Chellala' },
      { name: 'Dahmouni', nameAr: 'الدحموني', nameFr: 'Dahmouni' },
      { name: 'Rahouia', nameAr: 'رحوية', nameFr: 'Rahouia' },
      { name: 'Mechraa Safa', nameAr: 'مشرع الصفا', nameFr: 'Mechraa Safa' },
    ],
  },
  {
    code: '15', name: 'Tizi Ouzou', nameAr: 'تيزي وزو', nameFr: 'Tizi Ouzou',
    cities: [
      { name: 'Tizi Ouzou', nameAr: 'تيزي وزو', nameFr: 'Tizi Ouzou' },
      { name: 'Azazga', nameAr: 'عزازقة', nameFr: 'Azazga' },
      { name: 'Draa El Mizan', nameAr: 'ذراع الميزان', nameFr: 'Draâ El Mizan' },
      { name: 'Tigzirt', nameAr: 'تيقزيرت', nameFr: 'Tigzirt' },
      { name: 'Larbaa Nath Irathen', nameAr: 'الأربعاء ناث إيراثن', nameFr: 'Larbaâ Nath Irathen' },
      { name: 'Azzefoun', nameAr: 'أزفون', nameFr: 'Azzefoun' },
      { name: 'Ouadhia', nameAr: 'واضية', nameFr: 'Ouadhia' },
      { name: 'Ain El Hammam', nameAr: 'عين الحمام', nameFr: 'Aïn El Hammam' },
      { name: 'Makouda', nameAr: 'ماقودة', nameFr: 'Makouda' },
      { name: 'Beni Douala', nameAr: 'بني دوالة', nameFr: 'Béni Douala' },
    ],
  },
  {
    code: '16', name: 'Alger', nameAr: 'الجزائر', nameFr: 'Alger',
    cities: [
      { name: 'Algiers', nameAr: 'الجزائر العاصمة', nameFr: 'Alger' },
      { name: 'Bab Ezzouar', nameAr: 'باب الزوار', nameFr: 'Bab Ezzouar' },
      { name: 'Draria', nameAr: 'دراريا', nameFr: 'Draria' },
      { name: 'Zeralda', nameAr: 'زرالدة', nameFr: 'Zéralda' },
      { name: 'Birtouta', nameAr: 'بئر توتة', nameFr: 'Birtouta' },
      { name: 'El Harrach', nameAr: 'الحراش', nameFr: 'El Harrach' },
      { name: 'Rouiba', nameAr: 'رويبة', nameFr: 'Rouïba' },
      { name: 'Reghaia', nameAr: 'رغاية', nameFr: 'Reghaïa' },
      { name: 'Baraki', nameAr: 'براقي', nameFr: 'Baraki' },
      { name: 'Dar El Beida', nameAr: 'دار البيضاء', nameFr: 'Dar El Beïda' },
    ],
  },
  {
    code: '17', name: 'Djelfa', nameAr: 'الجلفة', nameFr: 'Djelfa',
    cities: [
      { name: 'Djelfa', nameAr: 'الجلفة', nameFr: 'Djelfa' },
      { name: 'Messaad', nameAr: 'مسعد', nameFr: 'Messaad' },
      { name: 'Ain Oussera', nameAr: 'عين وسارة', nameFr: 'Aïn Oussera' },
      { name: 'Birine', nameAr: 'بيرين', nameFr: 'Birine' },
      { name: 'Sidi Laadjal', nameAr: 'سيدي لعجال', nameFr: 'Sidi Laâdjal' },
      { name: 'El Idrissia', nameAr: 'الإدريسية', nameFr: 'El Idrissia' },
      { name: 'Had Sahary', nameAr: 'حد الصحاري', nameFr: 'Had Sahary' },
      { name: 'Dar Chioukh', nameAr: 'دار الشيوخ', nameFr: 'Dar Chioukh' },
      { name: 'Charef', nameAr: 'الشارف', nameFr: 'Charef' },
      { name: 'Faidh El Botma', nameAr: 'فيض البطمة', nameFr: 'Faidh El Botma' },
    ],
  },
  {
    code: '18', name: 'Jijel', nameAr: 'جيجل', nameFr: 'Jijel',
    cities: [
      { name: 'Jijel', nameAr: 'جيجل', nameFr: 'Jijel' },
      { name: 'Taher', nameAr: 'الطاهير', nameFr: 'Taher' },
      { name: 'El Milia', nameAr: 'الميلية', nameFr: 'El Milia' },
      { name: 'Sidi Maarouf', nameAr: 'سيدي معروف', nameFr: 'Sidi Maarouf' },
      { name: 'Settara', nameAr: 'سطارة', nameFr: 'Settara' },
      { name: 'El Aouana', nameAr: 'العوانة', nameFr: 'El Aouana' },
      { name: 'Ziama Mansouria', nameAr: 'ضيامة منصورية', nameFr: 'Ziama Mansouria' },
      { name: 'Chekfa', nameAr: 'شقفة', nameFr: 'Chekfa' },
      { name: 'Texenna', nameAr: 'تكسنة', nameFr: 'Texenna' },
      { name: 'El Ancer', nameAr: 'العنصر', nameFr: 'El Ancer' },
    ],
  },
  {
    code: '19', name: 'Sétif', nameAr: 'سطيف', nameFr: 'Sétif',
    cities: [
      { name: 'Sétif', nameAr: 'سطيف', nameFr: 'Sétif' },
      { name: 'El Eulma', nameAr: 'العلمة', nameFr: 'El Eulma' },
      { name: 'Ain Arnat', nameAr: 'عين أرنات', nameFr: 'Aïn Arnat' },
      { name: 'Ain Abessa', nameAr: 'عين عباسة', nameFr: 'Aïn Abessa' },
      { name: 'Bougaa', nameAr: 'بوقاعة', nameFr: 'Bougaâ' },
      { name: 'Salah Bey', nameAr: 'صالح باي', nameFr: 'Salah Bey' },
      { name: 'Ain Oulmene', nameAr: 'عين ولمان', nameFr: 'Aïn Oulmene' },
      { name: 'Ain Lahdjar', nameAr: 'عين الحجر', nameFr: 'Aïn Lahdjar' },
      { name: 'Beni Aziz', nameAr: 'بني عزيز', nameFr: 'Béni Aziz' },
      { name: 'Hammam Guergour', nameAr: 'حمام قرقور', nameFr: 'Hammam Guergour' },
    ],
  },
  {
    code: '20', name: 'Saïda', nameAr: 'سعيدة', nameFr: 'Saïda',
    cities: [
      { name: 'Saïda', nameAr: 'سعيدة', nameFr: 'Saïda' },
      { name: 'Balloul', nameAr: 'بلول', nameFr: 'Balloul' },
      { name: 'Ouled Brahim', nameAr: 'أولاد إبراهيم', nameFr: 'Ouled Brahim' },
      { name: 'Moulay Larbi', nameAr: 'مولاي العربي', nameFr: 'Moulay Larbi' },
      { name: 'Youb', nameAr: 'يوب', nameFr: 'Youb' },
      { name: 'Hounet', nameAr: 'حونت', nameFr: 'Hounet' },
      { name: 'Sidi Boubekeur', nameAr: 'سيدي بوبكر', nameFr: 'Sidi Boubekeur' },
      { name: 'Ain El Hadjar', nameAr: 'عين الحجر', nameFr: 'Aïn El Hadjar' },
      { name: 'Sidi Amar', nameAr: 'سيدي عمار', nameFr: 'Sidi Amar' },
      { name: 'Ouled Khaled', nameAr: 'أولاد خالد', nameFr: 'Ouled Khaled' },
    ],
  },
  {
    code: '21', name: 'Skikda', nameAr: 'سكيكدة', nameFr: 'Skikda',
    cities: [
      { name: 'Skikda', nameAr: 'سكيكدة', nameFr: 'Skikda' },
      { name: 'Collo', nameAr: 'القل', nameFr: 'Collo' },
      { name: 'Azzaba', nameAr: 'عزابة', nameFr: 'Azzaba' },
      { name: 'Tamalous', nameAr: 'تمالوس', nameFr: 'Tamalous' },
      { name: 'Ouled Attia', nameAr: 'أولاد عطية', nameFr: 'Ouled Attia' },
      { name: 'Sidi Mezghiche', nameAr: 'سيدي مزغيش', nameFr: 'Sidi Mezghiche' },
      { name: 'El Harrouch', nameAr: 'الحروش', nameFr: 'El Harrouch' },
      { name: 'Ramdane Djamel', nameAr: 'رمضان جمال', nameFr: 'Ramdane Djamel' },
      { name: 'Salah Bouchaour', nameAr: 'صالح بوشاور', nameFr: 'Salah Bouchaour' },
      { name: 'Beni Bechir', nameAr: 'بني بشير', nameFr: 'Béni Bechir' },
    ],
  },
  {
    code: '22', name: 'Sidi Bel Abbès', nameAr: 'سيدي بلعباس', nameFr: 'Sidi Bel Abbès',
    cities: [
      { name: 'Sidi Bel Abbès', nameAr: 'سيدي بلعباس', nameFr: 'Sidi Bel Abbès' },
      { name: 'Telagh', nameAr: 'تلاغ', nameFr: 'Telagh' },
      { name: 'Ain Trid', nameAr: 'عين تريد', nameFr: 'Aïn Trid' },
      { name: 'Mostefa Ben Brahim', nameAr: 'مصطفى بن براهيم', nameFr: 'Mostefa Ben Brahim' },
      { name: 'Ras El Ma', nameAr: 'رأس الماء', nameFr: 'Ras El Ma' },
      { name: 'Tessala', nameAr: 'تسالة', nameFr: 'Tessala' },
      { name: 'Sfisef', nameAr: 'سفيزف', nameFr: 'Sfisef' },
      { name: 'Ben Badis', nameAr: 'بن باديس', nameFr: 'Ben Badis' },
      { name: 'Marhoum', nameAr: 'مرحوم', nameFr: 'Marhoum' },
      { name: 'Sidi Ali Boussidi', nameAr: 'سيدي علي بوسيدي', nameFr: 'Sidi Ali Boussidi' },
    ],
  },
  {
    code: '23', name: 'Annaba', nameAr: 'عنابة', nameFr: 'Annaba',
    cities: [
      { name: 'Annaba', nameAr: 'عنابة', nameFr: 'Annaba' },
      { name: 'El Hadjar', nameAr: 'الحجار', nameFr: 'El Hadjar' },
      { name: 'Sidi Amar', nameAr: 'سيدي عمار', nameFr: 'Sidi Amar' },
      { name: 'Berrahal', nameAr: 'برحال', nameFr: 'Berrahal' },
      { name: 'El Bouni', nameAr: 'البوني', nameFr: 'El Bouni' },
      { name: 'Treatry', nameAr: 'التريعي', nameFr: 'Treatry' },
      { name: 'Ain Berda', nameAr: 'عين بردة', nameFr: 'Aïn Berda' },
      { name: 'Seraidi', nameAr: 'سرايدي', nameFr: 'Seraïdi' },
      { name: 'Chetaibi', nameAr: 'الشطايبي', nameFr: 'Chetaïbi' },
      { name: 'El Eulma', nameAr: 'العلمة', nameFr: 'El Eulma' },
    ],
  },
  {
    code: '24', name: 'Guelma', nameAr: 'قالمة', nameFr: 'Guelma',
    cities: [
      { name: 'Guelma', nameAr: 'قالمة', nameFr: 'Guelma' },
      { name: 'Bouchegouf', nameAr: 'بوشقوف', nameFr: 'Bouchegouf' },
      { name: 'Heliopolis', nameAr: 'هيليوبوليس', nameFr: 'Héliopolis' },
      { name: 'Hammam Debagh', nameAr: 'حمام دباغ', nameFr: 'Hammam Debagh' },
      { name: 'Oued Zenati', nameAr: 'وادي الزناتي', nameFr: 'Oued Zenati' },
      { name: 'Ain Hessania', nameAr: 'عين الحسنية', nameFr: 'Aïn Hessania' },
      { name: 'Ain Makhlouf', nameAr: 'عين مخلوف', nameFr: 'Aïn Makhlouf' },
      { name: 'Houari Boumediene', nameAr: 'هواري بومدين', nameFr: 'Houari Boumediene' },
      { name: 'Ain Sandel', nameAr: 'عين صندل', nameFr: 'Aïn Sandel' },
      { name: 'Khezara', nameAr: 'خزارة', nameFr: 'Khezara' },
    ],
  },
  {
    code: '25', name: 'Constantine', nameAr: 'قسنطينة', nameFr: 'Constantine',
    cities: [
      { name: 'Constantine', nameAr: 'قسنطينة', nameFr: 'Constantine' },
      { name: 'Ali Mendjeli', nameAr: 'علي منجلي', nameFr: 'Ali Mendjeli' },
      { name: 'Hamma Bouziane', nameAr: 'حامة بوزيان', nameFr: 'Hamma Bouziane' },
      { name: 'Didouche Mourad', nameAr: 'ديدوش مراد', nameFr: 'Didouche Mourad' },
      { name: 'El Khroub', nameAr: 'الخروب', nameFr: 'El Khroub' },
      { name: 'Ain Smara', nameAr: 'عين السمارة', nameFr: 'Aïn Smara' },
      { name: 'Zighoud Youcef', nameAr: 'زيغود يوسف', nameFr: 'Zighoud Youcef' },
      { name: 'Ibn Ziad', nameAr: 'ابن زياد', nameFr: 'Ibn Ziad' },
      { name: 'Ouled Rahmoune', nameAr: 'أولاد رحمون', nameFr: 'Ouled Rahmoune' },
      { name: 'Ain Abid', nameAr: 'عين عبيد', nameFr: 'Aïn Abid' },
    ],
  },
  {
    code: '26', name: 'Médéa', nameAr: 'المدية', nameFr: 'Médéa',
    cities: [
      { name: 'Médéa', nameAr: 'المدية', nameFr: 'Médéa' },
      { name: 'Berrouaghia', nameAr: 'البرواقية', nameFr: 'Berrouaghia' },
      { name: 'Ksar El Boukhari', nameAr: 'قصر البخاري', nameFr: 'Ksar El Boukhari' },
      { name: 'Ain Boucif', nameAr: 'عين بوسيف', nameFr: 'Aïn Boucif' },
      { name: 'Tablat', nameAr: 'تابلاط', nameFr: 'Tablat' },
      { name: 'Chellalet El Adhaoura', nameAr: 'شلالة العذاورة', nameFr: 'Chellalet El Adhaoura' },
      { name: 'El Omaria', nameAr: 'العمارية', nameFr: 'El Omaria' },
      { name: 'Beni Slimane', nameAr: 'بني سليمان', nameFr: 'Béni Slimane' },
      { name: 'Ouled Antar', nameAr: 'أولاد عنتر', nameFr: 'Ouled Antar' },
      { name: 'Seghouane', nameAr: 'سغوان', nameFr: 'Seghouane' },
    ],
  },
  {
    code: '27', name: 'Mostaganem', nameAr: 'مستغانم', nameFr: 'Mostaganem',
    cities: [
      { name: 'Mostaganem', nameAr: 'مستغانم', nameFr: 'Mostaganem' },
      { name: 'Sidi Ali', nameAr: 'سيدي علي', nameFr: 'Sidi Ali' },
      { name: 'Hassi Mameche', nameAr: 'حاسي ماماش', nameFr: 'Hassi Mameche' },
      { name: 'Stidia', nameAr: 'ستيدية', nameFr: 'Stidia' },
      { name: 'Ain Tedeles', nameAr: 'عين تادلس', nameFr: 'Aïn Tedeles' },
      { name: 'Fornaka', nameAr: 'فرناقة', nameFr: 'Fornaka' },
      { name: 'Mesra', nameAr: 'مصرة', nameFr: 'Mesra' },
      { name: 'Bouguirat', nameAr: 'بوقيرات', nameFr: 'Bouguirat' },
      { name: 'Sidi Lakhdar', nameAr: 'سيدي لخضر', nameFr: 'Sidi Lakhdar' },
      { name: 'Achaacha', nameAr: 'عشعاشة', nameFr: 'Achaâcha' },
    ],
  },
  {
    code: '28', name: "M'Sila", nameAr: 'المسيلة', nameFr: "M'Sila",
    cities: [
      { name: "M'Sila", nameAr: 'المسيلة', nameFr: "M'Sila" },
      { name: 'Sidi Aissa', nameAr: 'سيدي عيسى', nameFr: 'Sidi Aïssa' },
      { name: 'Magra', nameAr: 'مقرة', nameFr: 'Magra' },
      { name: 'Boussaada', nameAr: 'بوسعادة', nameFr: 'Bou Saâda' },
      { name: 'Ouled Derradj', nameAr: 'أولاد دراج', nameFr: 'Ouled Derradj' },
      { name: 'Hammam Dalaa', nameAr: 'حمام الضلعة', nameFr: 'Hammam Dalaa' },
      { name: 'Ain El Hadjel', nameAr: 'عين الحجل', nameFr: 'Aïn El Hadjel' },
      { name: 'Ain El Melh', nameAr: 'عين الملح', nameFr: 'Aïn El Melh' },
      { name: 'Berhoum', nameAr: 'برهوم', nameFr: 'Berhoum' },
      { name: 'Bou Saada', nameAr: 'بوسعادة', nameFr: 'Bou Saâda' },
    ],
  },
  {
    code: '29', name: 'Mascara', nameAr: 'معسكر', nameFr: 'Mascara',
    cities: [
      { name: 'Mascara', nameAr: 'معسكر', nameFr: 'Mascara' },
      { name: 'Sig', nameAr: 'سيق', nameFr: 'Sig' },
      { name: 'Tighenif', nameAr: 'تيغنيف', nameFr: 'Tighenif' },
      { name: 'Ghriss', nameAr: 'غريس', nameFr: 'Ghriss' },
      { name: 'Bouhanifia', nameAr: 'بوهنيفة', nameFr: 'Bouhanifia' },
      { name: 'Mohammadia', nameAr: 'المحمدية', nameFr: 'Mohammadia' },
      { name: 'Oued El Abtal', nameAr: 'وادي الأبطال', nameFr: 'Oued El Abtal' },
      { name: 'Ain Fekan', nameAr: 'عين فكان', nameFr: 'Aïn Fekan' },
      { name: 'Tizi', nameAr: 'تيزي', nameFr: 'Tizi' },
      { name: 'Zahana', nameAr: 'زهانة', nameFr: 'Zahana' },
    ],
  },
  {
    code: '30', name: 'Ouargla', nameAr: 'ورقلة', nameFr: 'Ouargla',
    cities: [
      { name: 'Ouargla', nameAr: 'ورقلة', nameFr: 'Ouargla' },
      { name: 'Hassi Messaoud', nameAr: 'حاسي مسعود', nameFr: 'Hassi Messaoud' },
      { name: 'Touggourt', nameAr: 'تقرت', nameFr: 'Touggourt' },
      { name: 'Temacine', nameAr: 'تماسين', nameFr: 'Temacine' },
      { name: 'Megarine', nameAr: 'المقارين', nameFr: 'Megarine' },
      { name: 'El Borma', nameAr: 'البرمة', nameFr: 'El Borma' },
      { name: 'Ngoussa', nameAr: 'نقوسة', nameFr: 'Ngoussa' },
      { name: 'Sidi Khouiled', nameAr: 'سيدي خويلد', nameFr: 'Sidi Khouiled' },
      { name: 'Ain Beida', nameAr: 'عين البيضاء', nameFr: 'Aïn Beïda' },
      { name: 'Rouissat', nameAr: 'رويسات', nameFr: 'Rouissat' },
    ],
  },
  {
    code: '31', name: 'Oran', nameAr: 'وهران', nameFr: 'Oran',
    cities: [
      { name: 'Oran', nameAr: 'وهران', nameFr: 'Oran' },
      { name: 'Bir El Djir', nameAr: 'بئر الجير', nameFr: 'Bir El Djir' },
      { name: 'Es Senia', nameAr: 'السانية', nameFr: 'Es Sénia' },
      { name: 'Gdyel', nameAr: 'قديل', nameFr: 'Gdyel' },
      { name: 'Ain El Turk', nameAr: 'عين الترك', nameFr: 'Aïn El Turk' },
      { name: 'Arzew', nameAr: 'أرزيو', nameFr: 'Arzew' },
      { name: 'Bethioua', nameAr: 'بطيوة', nameFr: 'Bethioua' },
      { name: 'Sidi Chami', nameAr: 'سيدي الشامي', nameFr: 'Sidi Chami' },
      { name: 'Mers El Kebir', nameAr: 'مرسى الكبير', nameFr: 'Mers El Kébir' },
      { name: 'Hassi Bounif', nameAr: 'حاسي بونيف', nameFr: 'Hassi Bounif' },
    ],
  },
  {
    code: '32', name: 'El Bayadh', nameAr: 'البيض', nameFr: 'El Bayadh',
    cities: [
      { name: 'El Bayadh', nameAr: 'البيض', nameFr: 'El Bayadh' },
      { name: 'Rogassa', nameAr: 'رقاصة', nameFr: 'Rogassa' },
      { name: 'Stitten', nameAr: 'ستيتن', nameFr: 'Stitten' },
      { name: 'Brezina', nameAr: 'بريزينة', nameFr: 'Brezina' },
      { name: 'Boualem', nameAr: 'بوعلام', nameFr: 'Boualem' },
      { name: 'El Mehara', nameAr: 'المهارة', nameFr: 'El Mehara' },
      { name: 'Cheguig', nameAr: 'شقيق', nameFr: 'Cheguig' },
      { name: 'Arbaouat', nameAr: 'عرباوات', nameFr: 'Arbaouat' },
      { name: 'Ghassoul', nameAr: 'الغاسول', nameFr: 'Ghassoul' },
      { name: 'Ain El Orak', nameAr: 'عين العراك', nameFr: 'Aïn El Orak' },
    ],
  },
  {
    code: '33', name: 'Illizi', nameAr: 'إليزي', nameFr: 'Illizi',
    cities: [
      { name: 'Illizi', nameAr: 'إليزي', nameFr: 'Illizi' },
      { name: 'Djanet', nameAr: 'جانت', nameFr: 'Djanet' },
      { name: 'In Amenas', nameAr: 'عين أمناس', nameFr: 'In Aménas' },
      { name: 'Debdeb', nameAr: 'دبداب', nameFr: 'Debdeb' },
      { name: 'Bordj Omar Driss', nameAr: 'برج عمر إدريس', nameFr: 'Bordj Omar Driss' },
      { name: 'Fort Polignac', nameAr: 'فورت بولينياك', nameFr: 'Fort Polignac' },
      { name: 'Bordj El Haoues', nameAr: 'برج الهواس', nameFr: 'Bordj El Haoues' },
      { name: 'Zarzaitine', nameAr: 'زرزايتين', nameFr: 'Zarzaïtine' },
    ],
  },
  {
    code: '34', name: 'Bordj Bou Arréridj', nameAr: 'برج بوعريريج', nameFr: 'Bordj Bou Arréridj',
    cities: [
      { name: 'Bordj Bou Arréridj', nameAr: 'برج بوعريريج', nameFr: 'Bordj Bou Arréridj' },
      { name: 'Ras El Oued', nameAr: 'رأس الوادي', nameFr: 'Ras El Oued' },
      { name: 'Bordj Ghdir', nameAr: 'برج غدير', nameFr: 'Bordj Ghdir' },
      { name: 'Mansourah', nameAr: 'المنصورة', nameFr: 'Mansourah' },
      { name: 'El Achir', nameAr: 'العشير', nameFr: 'El Achir' },
      { name: 'Ain Taghrout', nameAr: 'عين تاغروت', nameFr: 'Aïn Taghrout' },
      { name: 'Melouza', nameAr: 'ملوزة', nameFr: 'Melouza' },
      { name: 'Djaafra', nameAr: 'جعافرة', nameFr: 'Djaafra' },
      { name: 'El Hamadia', nameAr: 'الحمادية', nameFr: 'El Hamadia' },
      { name: 'Bir Kasdali', nameAr: 'بئر قصد علي', nameFr: 'Bir Kasdali' },
    ],
  },
  {
    code: '35', name: 'Boumerdès', nameAr: 'بومرداس', nameFr: 'Boumerdès',
    cities: [
      { name: 'Boumerdès', nameAr: 'بومرداس', nameFr: 'Boumerdès' },
      { name: 'Dellys', nameAr: 'دلس', nameFr: 'Dellys' },
      { name: 'Naciria', nameAr: 'ناصرية', nameFr: 'Naciria' },
      { name: 'Isser', nameAr: 'إيسر', nameFr: 'Isser' },
      { name: 'Bordj Menaiel', nameAr: 'برج منايل', nameFr: 'Bordj Menaïel' },
      { name: 'Khemis El Khechna', nameAr: 'خميس الخشنة', nameFr: 'Khemis El Khechna' },
      { name: 'Corso', nameAr: 'قورصو', nameFr: 'Corso' },
      { name: 'Thenia', nameAr: 'الثنية', nameFr: 'Thénia' },
      { name: 'Boudouaou', nameAr: 'بودواو', nameFr: 'Boudouaou' },
      { name: 'Tidjelabine', nameAr: 'تيجلابين', nameFr: 'Tidjelabine' },
    ],
  },
  {
    code: '36', name: 'El Tarf', nameAr: 'الطارف', nameFr: 'El Tarf',
    cities: [
      { name: 'El Tarf', nameAr: 'الطارف', nameFr: 'El Tarf' },
      { name: 'El Kala', nameAr: 'القالة', nameFr: 'El Kala' },
      { name: 'Boutheldja', nameAr: 'بوثلجة', nameFr: 'Boutheldja' },
      { name: 'Ben Mhidi', nameAr: 'بن مهيدي', nameFr: 'Ben M\'Hidi' },
      { name: 'Besbès', nameAr: 'بسباس', nameFr: 'Besbès' },
      { name: 'Drean', nameAr: 'الذرعان', nameFr: 'Dréan' },
      { name: 'Cheffia', nameAr: 'الشافية', nameFr: 'Cheffia' },
      { name: 'Bouhadjar', nameAr: 'بوحجار', nameFr: 'Bouhadjar' },
      { name: 'Ain El Assel', nameAr: 'عين العسل', nameFr: 'Aïn El Assel' },
      { name: 'Zitouna', nameAr: 'الزيتونة', nameFr: 'Zitouna' },
    ],
  },
  {
    code: '37', name: 'Tindouf', nameAr: 'تندوف', nameFr: 'Tindouf',
    cities: [
      { name: 'Tindouf', nameAr: 'تندوف', nameFr: 'Tindouf' },
      { name: 'Oum El Assel', nameAr: 'أم العسل', nameFr: 'Oum El Assel' },
      { name: 'Hassi Mounir', nameAr: 'حاسي منير', nameFr: 'Hassi Mounir' },
      { name: 'Gara Djebilet', nameAr: 'قارة جبيلات', nameFr: 'Gara Djebilet' },
      { name: 'Bordj Badji Mokhtar', nameAr: 'برج باجي مختار', nameFr: 'Bordj Badji Mokhtar' },
    ],
  },
  {
    code: '38', name: 'Tissemsilt', nameAr: 'تيسمسيلت', nameFr: 'Tissemsilt',
    cities: [
      { name: 'Tissemsilt', nameAr: 'تيسمسيلت', nameFr: 'Tissemsilt' },
      { name: 'Theniet El Had', nameAr: 'ثنية الحد', nameFr: 'Theniet El Had' },
      { name: 'Bordj Bou Naama', nameAr: 'برج بونعامة', nameFr: 'Bordj Bou Naama' },
      { name: 'Larbaa', nameAr: 'الأربعاء', nameFr: 'Larbaâ' },
      { name: 'Beni Chaib', nameAr: 'بني شعيب', nameFr: 'Béni Chaib' },
      { name: 'Lardjem', nameAr: 'الأرجم', nameFr: 'Lardjem' },
      { name: 'Ammari', nameAr: 'العماري', nameFr: 'Ammari' },
      { name: 'Khemisti', nameAr: 'خميستي', nameFr: 'Khemisti' },
      { name: 'Lazharia', nameAr: 'الأزهارية', nameFr: 'Lazharia' },
      { name: 'Bordj El Emir Abdelkader', nameAr: 'برج الأمير عبد القادر', nameFr: 'Bordj El Emir Abdelkader' },
    ],
  },
  {
    code: '39', name: 'El Oued', nameAr: 'الوادي', nameFr: 'El Oued',
    cities: [
      { name: 'El Oued', nameAr: 'الوادي', nameFr: 'El Oued' },
      { name: 'Robbah', nameAr: 'رباح', nameFr: 'Robbah' },
      { name: 'Guemar', nameAr: 'قمار', nameFr: 'Guemar' },
      { name: 'Reguiba', nameAr: 'الرقيبة', nameFr: 'Reguiba' },
      { name: 'Magrane', nameAr: 'مقران', nameFr: 'Magrane' },
      { name: 'Still', nameAr: 'الستيل', nameFr: 'Still' },
      { name: 'Taghzout', nameAr: 'تغزوت', nameFr: 'Taghzout' },
      { name: 'Debila', nameAr: 'دبيلة', nameFr: 'Debila' },
      { name: 'Hassi Khalifa', nameAr: 'حاسي خليفة', nameFr: 'Hassi Khalifa' },
      { name: 'Kouinine', nameAr: 'كوينين', nameFr: 'Kouinine' },
    ],
  },
  {
    code: '40', name: 'Khenchela', nameAr: 'خنشلة', nameFr: 'Khenchela',
    cities: [
      { name: 'Khenchela', nameAr: 'خنشلة', nameFr: 'Khenchela' },
      { name: 'Kais', nameAr: 'قايس', nameFr: 'Kais' },
      { name: 'Baghai', nameAr: 'بغاي', nameFr: 'Baghaï' },
      { name: 'El Hamma', nameAr: 'الحمة', nameFr: 'El Hamma' },
      { name: 'Ain Touila', nameAr: 'عين تويلة', nameFr: 'Aïn Touila' },
      { name: 'Remila', nameAr: 'الرميلة', nameFr: 'Remila' },
      { name: 'El Oueldja', nameAr: 'الولجة', nameFr: 'El Oueldja' },
      { name: 'Chechar', nameAr: 'ششار', nameFr: 'Chechar' },
      { name: 'Babar', nameAr: 'بابار', nameFr: 'Babar' },
      { name: 'Bouhmama', nameAr: 'بوحمامة', nameFr: 'Bouhmama' },
    ],
  },
  {
    code: '41', name: 'Souk Ahras', nameAr: 'سوق أهراس', nameFr: 'Souk Ahras',
    cities: [
      { name: 'Souk Ahras', nameAr: 'سوق أهراس', nameFr: 'Souk Ahras' },
      { name: 'Sedrata', nameAr: 'صدراتة', nameFr: 'Sedrata' },
      { name: 'Hanancha', nameAr: 'حنانشة', nameFr: 'Hanancha' },
      { name: 'Ouled Moumen', nameAr: 'أولاد مؤمن', nameFr: 'Ouled Moumen' },
      { name: 'Taoura', nameAr: 'تاورة', nameFr: 'Taoura' },
      { name: 'Zaarouria', nameAr: 'الزعرورية', nameFr: 'Zaarouria' },
      { name: 'Merahna', nameAr: 'المراهنة', nameFr: 'Merahna' },
      { name: 'Mdaourouch', nameAr: 'مداوروش', nameFr: 'Mdaourouch' },
      { name: 'Bir Bouhouche', nameAr: 'بئر بوحوش', nameFr: 'Bir Bouhouche' },
      { name: 'Mechroha', nameAr: 'مشروحة', nameFr: 'Mechroha' },
    ],
  },
  {
    code: '42', name: 'Tipaza', nameAr: 'تيبازة', nameFr: 'Tipaza',
    cities: [
      { name: 'Tipaza', nameAr: 'تيبازة', nameFr: 'Tipaza' },
      { name: 'Kolea', nameAr: 'قليعة', nameFr: 'Koléa' },
      { name: 'Cherchell', nameAr: 'شرشال', nameFr: 'Cherchell' },
      { name: 'Menaceur', nameAr: 'مناصر', nameFr: 'Menaceur' },
      { name: 'Ahmer El Ain', nameAr: 'أحمر العين', nameFr: 'Ahmer El Aïn' },
      { name: 'Bou Ismail', nameAr: 'بوإسماعيل', nameFr: 'Bou Ismaïl' },
      { name: 'Chaiba', nameAr: 'الشيبة', nameFr: 'Chaïba' },
      { name: 'Hadjout', nameAr: 'حجوط', nameFr: 'Hadjout' },
      { name: 'Fouka', nameAr: 'فوكة', nameFr: 'Fouka' },
      { name: 'Gouraya', nameAr: 'قورايا', nameFr: 'Gouraya' },
    ],
  },
  {
    code: '43', name: 'Mila', nameAr: 'ميلة', nameFr: 'Mila',
    cities: [
      { name: 'Mila', nameAr: 'ميلة', nameFr: 'Mila' },
      { name: 'Ferdjioua', nameAr: 'فرجيوة', nameFr: 'Ferdjioua' },
      { name: 'Chelghoum Laid', nameAr: 'شلغوم العيد', nameFr: 'Chelghoum Laïd' },
      { name: 'Rouached', nameAr: 'الروشة', nameFr: 'Rouached' },
      { name: 'Grarem Gouga', nameAr: 'قرارم قوقة', nameFr: 'Grarem Gouga' },
      { name: 'Hamala', nameAr: 'الحمالة', nameFr: 'Hamala' },
      { name: 'Ain Beida Harriche', nameAr: 'عين البيضاء الحريش', nameFr: 'Aïn Beïda Harriche' },
      { name: 'Tadjenanet', nameAr: 'تاجنانت', nameFr: 'Tadjenanet' },
      { name: 'Sidi Merouane', nameAr: 'سيدي مروان', nameFr: 'Sidi Merouane' },
      { name: 'Oued Endja', nameAr: 'وادي العنجة', nameFr: 'Oued Endja' },
    ],
  },
  {
    code: '44', name: 'Ain Defla', nameAr: 'عين الدفلى', nameFr: 'Aïn Defla',
    cities: [
      { name: 'Ain Defla', nameAr: 'عين الدفلى', nameFr: 'Aïn Defla' },
      { name: 'Khemis Miliana', nameAr: 'خميس مليانة', nameFr: 'Khemis Miliana' },
      { name: 'Rouina', nameAr: 'روينة', nameFr: 'Rouina' },
      { name: 'Djelida', nameAr: 'الجليدة', nameFr: 'Djelida' },
      { name: 'El Attaf', nameAr: 'الأطواف', nameFr: 'El Attaf' },
      { name: 'Arib', nameAr: 'عريب', nameFr: 'Arib' },
      { name: 'Miliana', nameAr: 'مليانة', nameFr: 'Miliana' },
      { name: 'El Abadia', nameAr: 'العبادية', nameFr: 'El Abadia' },
      { name: 'Hammam Righa', nameAr: 'حمام ريغة', nameFr: 'Hammam Righa' },
      { name: 'Ain Lechiakh', nameAr: 'عين الاشياخ', nameFr: 'Aïn Lechiakh' },
    ],
  },
  {
    code: '45', name: 'Naâma', nameAr: 'النعامة', nameFr: 'Naâma',
    cities: [
      { name: 'Naâma', nameAr: 'النعامة', nameFr: 'Naâma' },
      { name: 'Mecheria', nameAr: 'المشرية', nameFr: 'Mecheria' },
      { name: 'Ain Sefra', nameAr: 'عين الصفراء', nameFr: 'Aïn Sefra' },
      { name: 'Tiout', nameAr: 'تيوت', nameFr: 'Tiout' },
      { name: 'Sfissifa', nameAr: 'سفيسيفة', nameFr: 'Sfissifa' },
      { name: 'Moghrar', nameAr: 'مغرار', nameFr: 'Moghrar' },
      { name: 'Assela', nameAr: 'أسلة', nameFr: 'Assela' },
      { name: 'Kasdir', nameAr: 'قصدير', nameFr: 'Kasdir' },
      { name: 'Djeniene Bourezg', nameAr: 'جنين بورزق', nameFr: 'Djeniene Bourezg' },
      { name: 'Ain Ben Khelil', nameAr: 'عين بن خليل', nameFr: 'Aïn Ben Khelil' },
    ],
  },
  {
    code: '46', name: 'Ain Témouchent', nameAr: 'عين تموشنت', nameFr: 'Aïn Témouchent',
    cities: [
      { name: 'Ain Témouchent', nameAr: 'عين تموشنت', nameFr: 'Aïn Témouchent' },
      { name: 'Beni Saf', nameAr: 'بني صاف', nameFr: 'Béni Saf' },
      { name: 'El Malah', nameAr: 'الملاح', nameFr: 'El Malah' },
      { name: 'Hammam Bou Hadjar', nameAr: 'حمام بوحجر', nameFr: 'Hammam Bou Hadjar' },
      { name: 'Ouled Boudjemaa', nameAr: 'أولاد بوجمعة', nameFr: 'Ouled Boudjemaâ' },
      { name: 'Aghlal', nameAr: 'أغلال', nameFr: 'Aghlal' },
      { name: 'El Amria', nameAr: 'العامرية', nameFr: 'El Amria' },
      { name: 'Oulhaca El Gheraba', nameAr: 'ولهاصة الغرابة', nameFr: 'Oulhaca El Gheraba' },
      { name: 'Sidi Ben Adda', nameAr: 'سيدي بن عدة', nameFr: 'Sidi Ben Adda' },
      { name: 'Terga', nameAr: 'ترقى', nameFr: 'Terga' },
    ],
  },
  {
    code: '47', name: 'Ghardaïa', nameAr: 'غرداية', nameFr: 'Ghardaïa',
    cities: [
      { name: 'Ghardaïa', nameAr: 'غرداية', nameFr: 'Ghardaïa' },
      { name: 'El Meniaa', nameAr: 'المنيعة', nameFr: 'El Ménéaa' },
      { name: 'Berriane', nameAr: 'بريان', nameFr: 'Berriane' },
      { name: 'Metlili', nameAr: 'متليلي', nameFr: 'Metlili' },
      { name: 'El Guerrara', nameAr: 'القرارة', nameFr: 'El Guerrara' },
      { name: 'Dhayet Ben Dhahoua', nameAr: 'ضاية بن ضحوة', nameFr: 'Dhayet Ben Dhahoua' },
      { name: 'Sebseb', nameAr: 'سبسب', nameFr: 'Sebseb' },
      { name: 'Bounoura', nameAr: 'بونورة', nameFr: 'Bounoura' },
      { name: 'Zelfana', nameAr: 'زلفانة', nameFr: 'Zelfana' },
      { name: 'Mansoura', nameAr: 'المنصورة', nameFr: 'Mansoura' },
    ],
  },
  {
    code: '48', name: 'Relizane', nameAr: 'غليزان', nameFr: 'Relizane',
    cities: [
      { name: 'Relizane', nameAr: 'غليزان', nameFr: 'Relizane' },
      { name: 'Mazouna', nameAr: 'مازونة', nameFr: 'Mazouna' },
      { name: 'Oued Rhiou', nameAr: 'واد الرهيو', nameFr: 'Oued Rhiou' },
      { name: 'Yellel', nameAr: 'يلل', nameFr: 'Yellel' },
      { name: 'Sidi Mhamed Ben Ali', nameAr: 'سيدي محمد بن علي', nameFr: 'Sidi M\'hamed Ben Ali' },
      { name: 'El Hassi', nameAr: 'الحاسي', nameFr: 'El Hassi' },
      { name: 'Hamri', nameAr: 'الحمري', nameFr: 'Hamri' },
      { name: 'Djidiouia', nameAr: 'جديوية', nameFr: 'Djidiouia' },
      { name: 'Ammi Moussa', nameAr: 'عمي موسى', nameFr: 'Ammi Moussa' },
      { name: 'Zemmoura', nameAr: 'زمورة', nameFr: 'Zemmoura' },
    ],
  },
  {
    code: '49', name: 'Timimoun', nameAr: 'تيميمون', nameFr: 'Timimoun',
    cities: [
      { name: 'Timimoun', nameAr: 'تيميمون', nameFr: 'Timimoun' },
      { name: 'Ouled Said', nameAr: 'أولاد سعيد', nameFr: 'Ouled Saïd' },
      { name: 'Aougrout', nameAr: 'أوقروت', nameFr: 'Aougrout' },
      { name: 'Deldoul', nameAr: 'الدلدول', nameFr: 'Deldoul' },
      { name: 'Charouine', nameAr: 'شروين', nameFr: 'Charouine' },
      { name: 'Metarfa', nameAr: 'متارفة', nameFr: 'Metarfa' },
      { name: 'Tinerkouk', nameAr: 'تينركوك', nameFr: 'Tinerkouk' },
      { name: 'Ksar Kaddour', nameAr: 'قصر قدور', nameFr: 'Ksar Kaddour' },
      { name: 'Talmine', nameAr: 'تالمين', nameFr: 'Talmine' },
    ],
  },
  {
    code: '50', name: 'Bordj Badji Mokhtar', nameAr: 'برج باجي مختار', nameFr: 'Bordj Badji Mokhtar',
    cities: [
      { name: 'Bordj Badji Mokhtar', nameAr: 'برج باجي مختار', nameFr: 'Bordj Badji Mokhtar' },
      { name: 'Timiaouine', nameAr: 'تيمياوين', nameFr: 'Timiaouine' },
      { name: 'Timokten', nameAr: 'تيموكتن', nameFr: 'Timokten' },
      { name: 'Erg Chegaga', nameAr: 'عرق الشقاقة', nameFr: 'Erg Chigaga' },
      { name: 'Hassi Khebi', nameAr: 'حاسي خبي', nameFr: 'Hassi Khebi' },
    ],
  },
  {
    code: '51', name: 'Ouled Djellal', nameAr: 'أولاد جلال', nameFr: 'Ouled Djellal',
    cities: [
      { name: 'Ouled Djellal', nameAr: 'أولاد جلال', nameFr: 'Ouled Djellal' },
      { name: 'Sidi Khaled', nameAr: 'سيدي خالد', nameFr: 'Sidi Khaled' },
      { name: 'Doucen', nameAr: 'الدوسن', nameFr: 'Doucen' },
      { name: 'Chaiba', nameAr: 'الشيبة', nameFr: 'Chaïba' },
      { name: 'Besbes', nameAr: 'بسباس', nameFr: 'Besbes' },
      { name: 'Ras El Miaad', nameAr: 'رأس الميعاد', nameFr: 'Ras El Miaad' },
      { name: 'El Haouita', nameAr: 'الهويطة', nameFr: 'El Haouita' },
    ],
  },
  {
    code: '52', name: 'Béni Abbès', nameAr: 'بني عباس', nameFr: 'Béni Abbès',
    cities: [
      { name: 'Béni Abbès', nameAr: 'بني عباس', nameFr: 'Béni Abbès' },
      { name: 'El Ouata', nameAr: 'الواطة', nameFr: 'El Ouata' },
      { name: 'Tamtert', nameAr: 'تامتارت', nameFr: 'Tamtert' },
      { name: 'Igli', nameAr: 'إيقلي', nameFr: 'Igli' },
      { name: 'Kerzaz', nameAr: 'كرزاز', nameFr: 'Kerzaz' },
      { name: 'Timoudi', nameAr: 'تيمودي', nameFr: 'Timoudi' },
      { name: 'Beni Ikhlef', nameAr: 'بني إخلف', nameFr: 'Béni Ikhlef' },
      { name: 'Ksabi', nameAr: 'قصبي', nameFr: 'Ksabi' },
    ],
  },
  {
    code: '53', name: 'In Salah', nameAr: 'عين صالح', nameFr: 'In Salah',
    cities: [
      { name: 'In Salah', nameAr: 'عين صالح', nameFr: 'In Salah' },
      { name: 'Foggaret Ezzaouia', nameAr: 'فقارة الزاوية', nameFr: 'Foggaret Ezzaouia' },
      { name: 'In Ghar', nameAr: 'إن غار', nameFr: 'In Ghar' },
      { name: 'Ain Ghar', nameAr: 'عين غار', nameFr: 'Aïn Ghar' },
      { name: 'Tamekten', nameAr: 'تاموكتن', nameFr: 'Tamekten' },
      { name: 'Zaouiet Kounta', nameAr: 'زاوية كنتة', nameFr: 'Zaouiet Kounta' },
    ],
  },
  {
    code: '54', name: 'In Guezzam', nameAr: 'إن قزام', nameFr: 'In Guezzam',
    cities: [
      { name: 'In Guezzam', nameAr: 'إن قزام', nameFr: 'In Guezzam' },
      { name: 'Tin Zaouaten', nameAr: 'تين زاواتين', nameFr: 'Tin Zaouaten' },
      { name: 'Iherir', nameAr: 'إيهرير', nameFr: 'Iherir' },
      { name: 'Tazrouk', nameAr: 'تازروك', nameFr: 'Tazrouk' },
      { name: 'Arak', nameAr: 'أراك', nameFr: 'Arak' },
    ],
  },
  {
    code: '55', name: 'Touggourt', nameAr: 'تقرت', nameFr: 'Touggourt',
    cities: [
      { name: 'Touggourt', nameAr: 'تقرت', nameFr: 'Touggourt' },
      { name: 'Temacine', nameAr: 'تماسين', nameFr: 'Temacine' },
      { name: 'Megarine', nameAr: 'المقارين', nameFr: 'Megarine' },
      { name: 'Sidi Slimane', nameAr: 'سيدي سليمان', nameFr: 'Sidi Slimane' },
      { name: 'Nezla', nameAr: 'نزلة', nameFr: 'Nezla' },
      { name: 'Zaouia El Abidia', nameAr: 'الزاوية العابدية', nameFr: 'Zaouia El Abidia' },
      { name: 'Benaceur', nameAr: 'بناصر', nameFr: 'Benaceur' },
      { name: 'Tebesbest', nameAr: 'تبسبست', nameFr: 'Tebesbest' },
      { name: 'El Hadjira', nameAr: 'الحاجرة', nameFr: 'El Hadjira' },
      { name: 'Taibet', nameAr: 'طيبة', nameFr: 'Taïbet' },
    ],
  },
  {
    code: '56', name: 'Djanet', nameAr: 'جانت', nameFr: 'Djanet',
    cities: [
      { name: 'Djanet', nameAr: 'جانت', nameFr: 'Djanet' },
      { name: 'Bordj El Haoues', nameAr: 'برج الهواس', nameFr: 'Bordj El Haoues' },
      { name: 'Illizi', nameAr: 'إليزي', nameFr: 'Illizi' },
      { name: 'Iherir', nameAr: 'إيهرير', nameFr: 'Iherir' },
      { name: 'Tarat', nameAr: 'تارات', nameFr: 'Tarat' },
    ],
  },
  {
    code: '57', name: 'El Meghaier', nameAr: 'المغير', nameFr: 'El Meghaier',
    cities: [
      { name: 'El Meghaier', nameAr: 'المغير', nameFr: 'El Meghaier' },
      { name: 'Djamaa', nameAr: 'جامعة', nameFr: 'Djamaa' },
      { name: 'Sidi Amrane', nameAr: 'سيدي عمران', nameFr: 'Sidi Amrane' },
      { name: 'Still', nameAr: 'الستيل', nameFr: 'Still' },
      { name: 'Ourmes', nameAr: 'أورمس', nameFr: 'Ourmes' },
      { name: 'Tendla', nameAr: 'تندلة', nameFr: 'Tendla' },
      { name: 'Oum Touyour', nameAr: 'أم الطيور', nameFr: 'Oum Touyour' },
      { name: 'Sidi Khellil', nameAr: 'سيدي خليل', nameFr: 'Sidi Khellil' },
    ],
  },
  {
    code: '58', name: 'El Menia', nameAr: 'المنيعة', nameFr: 'El Menia',
    cities: [
      { name: 'El Menia', nameAr: 'المنيعة', nameFr: 'El Menia' },
      { name: 'Hassi Gara', nameAr: 'حاسي قارة', nameFr: 'Hassi Gara' },
      { name: 'Hassi Fehal', nameAr: 'حاسي فحل', nameFr: 'Hassi Fehal' },
      { name: 'Mansoura', nameAr: 'المنصورة', nameFr: 'Mansoura' },
      { name: 'Ain Ben Khelil', nameAr: 'عين بن خليل', nameFr: 'Aïn Ben Khelil' },
      { name: 'Ouargla', nameAr: 'ورقلة', nameFr: 'Ouargla' },
    ],
  },
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getWilayaByCode(code: string): Wilaya | undefined {
  return ALGERIA_WILAYAS.find(w => w.code === code)
}

export function getWilayaByName(name: string): Wilaya | undefined {
  return ALGERIA_WILAYAS.find(w =>
    w.name.toLowerCase() === name.toLowerCase() ||
    w.nameAr === name ||
    w.nameFr.toLowerCase() === name.toLowerCase()
  )
}

export function getCitiesByWilayaCode(code: string): City[] {
  return getWilayaByCode(code)?.cities ?? []
}

// Returns city Latin names (the values stored in the DB)
export function getCityNames(code: string): string[] {
  return getCitiesByWilayaCode(code).map(c => c.name)
}

export function searchWilayas(query: string): Wilaya[] {
  const q = query.toLowerCase()
  return ALGERIA_WILAYAS.filter(w =>
    w.name.toLowerCase().includes(q) ||
    w.nameAr.includes(query) ||
    w.nameFr.toLowerCase().includes(q) ||
    w.cities.some(c =>
      c.name.toLowerCase().includes(q) ||
      c.nameAr.includes(query) ||
      c.nameFr.toLowerCase().includes(q)
    )
  )
}
