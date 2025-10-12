// Algeria-specific constants
// src/lib/constants/algeria.ts

export interface wilaya {
  code: string
  name: string
  nameAr: string
  cities: string[]
}

// All 58 wilayas of Algeria with comprehensive city lists
export const ALGERIA_WILAYAS: wilaya[] = [
  {
    code: '01',
    name: 'Adrar',
    nameAr: 'أدرار',
    cities: ['Adrar', 'Timimoun', 'Aoulef', 'Reggane', 'Inzegmir', 'Tit', 'Ksar Kaddour', 'Tsabit', 'Fenoughil', 'Zaouiet Kounta']
  },
  {
    code: '02',
    name: 'Chlef',
    nameAr: 'الشلف',
    cities: ['Chlef', 'Tenès', 'Beni Haoua', 'El Karimia', 'Sobha', 'Harchoun', 'Ouled Fares', 'Boukadir', 'Oued Sly', 'Abou El Hassan']
  },
  {
    code: '03',
    name: 'Laghouat',
    nameAr: 'الأغواط',
    cities: ['Laghouat', 'Aflou', 'Ksar El Hirane', 'Brida', 'Gueltat Sidi Saad', 'Ain Madhi', 'Tadjemout', 'Oued Morra', 'Hassi Delaa', 'Hassi R\'Mel']
  },
  {
    code: '04',
    name: 'Oum El Bouaghi',
    nameAr: 'أم البواقي',
    cities: ['Oum El Bouaghi', 'Ain Beida', 'Ain MLila', 'Behir Chergui', 'El Amiria', 'Sigus', 'Ain Fakroun', 'Ain Kercha', 'Meskiana', 'Ain Babouche']
  },
  {
    code: '05',
    name: 'Batna',
    nameAr: 'باتنة',
    cities: ['Batna', 'Barika', 'Arris', 'Ain Touta', 'Merouana', 'El Madher', 'Tazoult', 'Ngaous', 'Menaa', 'Ras El Aioun']
  },
  {
    code: '06',
    name: 'Béjaïa',
    nameAr: 'بجاية',
    cities: ['Béjaïa', 'Akbou', 'Kherrata', 'Sidi Aich', 'Amizour', 'Barbacha', 'Tazmalt', 'Tichy', 'Seddouk', 'Aokas']
  },
  {
    code: '07',
    name: 'Biskra',
    nameAr: 'بسكرة',
    cities: ['Biskra', 'Sidi Okba', 'Ouled Djellal', 'El Kantara', 'Tolga', 'Foughala', 'Lichana', 'Zeribet El Oued', 'Sidi Khaled', 'El Outaya']
  },
  {
    code: '08',
    name: 'Béchar',
    nameAr: 'بشار',
    cities: ['Béchar', 'Kenadsa', 'Abadla', 'Beni Ounif', 'Igli', 'Taghit', 'Ouled Khoudir', 'Meridja', 'El Ouata', 'Lahmar']
  },
  {
    code: '09',
    name: 'Blida',
    nameAr: 'البليدة',
    cities: ['Blida', 'Boufarik','Benchabane', 'Larbaa', 'Bougara', 'Ouled Yaich', 'Chebli', 'Mouzaia', 'Souma', 'Bouinan', 'Meftah']
  },
  {
    code: '10',
    name: 'Bouira',
    nameAr: 'البويرة',
    cities: ['Bouira', 'Lakhdaria', 'Sour El Ghouzlane', 'Ain Bessem', 'Birghbalou', 'Kadiria', 'Aomar', 'Haizer', 'Bordj Oukhriss', 'Bechloul']
  },
  {
    code: '11',
    name: 'Tamanrasset',
    nameAr: 'تمنراست',
    cities: ['Tamanrasset', 'In Guezzam', 'Tin Zaouaten', 'In Salah', 'Foggaret Ezzaouia', 'Abalessa', 'In Amguel', 'Tazrouk', 'Idles', 'In Ghar']
  },
  {
    code: '12',
    name: 'Tébessa',
    nameAr: 'تبسة',
    cities: ['Tébessa', 'Cheria', 'El Aouinet', 'Bir El Ater', 'El Ogla', 'Negrine', 'El Houidjbet', 'Ouenza', 'El Kouif', 'Hammamet']
  },
  {
    code: '13',
    name: 'Tlemcen',
    nameAr: 'تلمسان',
    cities: ['Tlemcen', 'Maghnia', 'Nedroma', 'Remchi', 'Sebdou', 'Ghazaouet', 'Marsa Ben Mhidi', 'Hennaya', 'Bensekrane', 'Ouled Mimoun']
  },
  {
    code: '14',
    name: 'Tiaret',
    nameAr: 'تيارت',
    cities: ['Tiaret', 'Sougueur', 'Mahdia', 'Medroussa', 'Frenda', 'Ain Deheb', 'Ksar Chellala', 'Dahmouni', 'Rahouia', 'Mechraa Safa']
  },
  {
    code: '15',
    name: 'Tizi Ouzou',
    nameAr: 'تيزي وزو',
    cities: ['Tizi Ouzou', 'Azazga', 'Draa El Mizan', 'Tigzirt', 'Larbaa Nath Irathen', 'Azzefoun', 'Ouadhia', 'Ain El Hammam', 'Makouda', 'Beni Douala']
  },
  {
    code: '16',
    name: 'Alger',
    nameAr: 'الجزائر',
    cities: ['Algiers', 'Bab Ezzouar', 'Draria', 'Zeralda', 'Birtouta', 'El Harrach', 'Rouiba', 'Reghaia', 'Baraki', 'Dar El Beida']
  },
  {
    code: '17',
    name: 'Djelfa',
    nameAr: 'الجلفة',
    cities: ['Djelfa', 'Messaad', 'Ain Oussera', 'Birine', 'Sidi Laadjal', 'El Idrissia', 'Had Sahary', 'Dar Chioukh', 'Charef', 'Faidh El Botma']
  },
  {
    code: '18',
    name: 'Jijel',
    nameAr: 'جيجل',
    cities: ['Jijel', 'Taher', 'El Milia', 'Sidi Maarouf', 'Settara', 'El Aouana', 'Ziama Mansouria', 'Chekfa', 'Texenna', 'El Ancer']
  },
  {
    code: '19',
    name: 'Sétif',
    nameAr: 'سطيف',
    cities: ['Sétif', 'El Eulma', 'Ain Arnat', 'Ain Abessa', 'Bougaa', 'Salah Bey', 'Ain Oulmene', 'Ain Lahdjar', 'Beni Aziz', 'Hammam Guergour']
  },
  {
    code: '20',
    name: 'Saïda',
    nameAr: 'سعيدة',
    cities: ['Saïda', 'Balloul', 'Ouled Brahim', 'Moulay Larbi', 'Youb', 'Hounet', 'Sidi Boubekeur', 'Ain El Hadjar', 'Sidi Amar', 'Ouled Khaled']
  },
  {
    code: '21',
    name: 'Skikda',
    nameAr: 'سكيكدة',
    cities: ['Skikda', 'Collo', 'Azzaba', 'Tamalous', 'Ouled Attia', 'Sidi Mezghiche', 'El Harrouch', 'Ramdane Djamel', 'Salah Bouchaour', 'Beni Bechir']
  },
  {
    code: '22',
    name: 'Sidi Bel Abbès',
    nameAr: 'سيدي بلعباس',
    cities: ['Sidi Bel Abbès', 'Telagh', 'Ain Trid', 'Mostefa Ben Brahim', 'Ras El Ma', 'Tessala', 'Sfisef', 'Ben Badis', 'Marhoum', 'Sidi Ali Boussidi']
  },
  {
    code: '23',
    name: 'Annaba',
    nameAr: 'عنابة',
    cities: ['Annaba', 'El Hadjar', 'Sidi Amar', 'Berrahal', 'El Bouni', 'Treatry', 'Ain Berda', 'Seraidi', 'Chetaibi', 'El Eulma']
  },
  {
    code: '24',
    name: 'Guelma',
    nameAr: 'قالمة',
    cities: ['Guelma', 'Bouchegouf', 'Heliopolis', 'Hammam Debagh', 'Oued Zenati', 'Ain Hessania', 'Ain Makhlouf', 'Houari Boumediene', 'Ain Sandel', 'Khezara']
  },
  {
    code: '25',
    name: 'Constantine',
    nameAr: 'قسنطينة',
    cities: ['Constantine', 'Ali Mendjeli', 'Hamma Bouziane', 'Didouche Mourad', 'El Khroub', 'Ain Smara', 'Zighoud Youcef', 'Ibn Ziad', 'Ouled Rahmoune', 'Ain Abid']
  },
  {
    code: '26',
    name: 'Médéa',
    nameAr: 'المدية',
    cities: ['Médéa', 'Berrouaghia', 'Ksar El Boukhari', 'Ain Boucif', 'Tablat', 'Chellalet El Adhaoura', 'El Omaria', 'Beni Slimane', 'Ouled Antar', 'Seghouane']
  },
  {
    code: '27',
    name: 'Mostaganem',
    nameAr: 'مستغانم',
    cities: ['Mostaganem', 'Sidi Ali', 'Hassi Mameche', 'Stidia', 'Ain Tedeles', 'Fornaka', 'Mesra', 'Bouguirat', 'Sidi Lakhdar', 'Achaacha']
  },
  {
    code: '28',
    name: 'M\'Sila',
    nameAr: 'المسيلة',
    cities: ['M\'Sila', 'Sidi Aissa', 'Magra', 'Boussaada', 'Ouled Derradj', 'Hammam Dalaa', 'Bou Saada', 'Ain El Hadjel', 'Ain El Melh', 'Berhoum']
  },
  {
    code: '29',
    name: 'Mascara',
    nameAr: 'معسكر',
    cities: ['Mascara', 'Sig', 'Tighenif', 'Ghriss', 'Bouhanifia', 'Mohammadia', 'Oued El Abtal', 'Ain Fekan', 'Tizi', 'Zahana']
  },
  {
    code: '30',
    name: 'Ouargla',
    nameAr: 'ورقلة',
    cities: ['Ouargla', 'Hassi Messaoud', 'Touggourt', 'Temacine', 'Megarine', 'El Borma', 'Ngoussa', 'Sidi Khouiled', 'Ain Beida', 'Rouissat']
  },
  {
    code: '31',
    name: 'Oran',
    nameAr: 'وهران',
    cities: ['Oran', 'Bir El Djir', 'Es Senia', 'Gdyel', 'Ain El Turk', 'Arzew', 'Bethioua', 'Sidi Chami', 'Mers El Kebir', 'Hassi Bounif']
  },
  {
    code: '32',
    name: 'El Bayadh',
    nameAr: 'البيض',
    cities: ['El Bayadh', 'Rogassa', 'Stitten', 'Brezina', 'Boualem', 'El Mehara', 'Cheguig', 'Arbaouat', 'Ghassoul', 'Ain El Orak']
  },
  {
    code: '33',
    name: 'Illizi',
    nameAr: 'إليزي',
    cities: ['Illizi', 'Djanet', 'In Amenas', 'Debdeb', 'Bordj Omar Driss', 'Fort Polignac', 'Bordj El Haoues', 'Zarzaitine']
  },
  {
    code: '34',
    name: 'Bordj Bou Arréridj',
    nameAr: 'برج بوعريريج',
    cities: ['Bordj Bou Arréridj', 'Ras El Oued', 'Bordj Ghdir', 'Mansourah', 'El Achir', 'Ain Taghrout', 'Melouza', 'Djaafra', 'El Hamadia', 'Bir Kasdali']
  },
  {
    code: '35',
    name: 'Boumerdès',
    nameAr: 'بومرداس',
    cities: ['Boumerdès', 'Dellys', 'Naciria', 'Isser', 'Bordj Menaiel', 'Khemis El Khechna', 'Corso', 'Thenia', 'Boudouaou', 'Tidjelabine']
  },
  {
    code: '36',
    name: 'El Tarf',
    nameAr: 'الطارف',
    cities: ['El Tarf', 'El Kala', 'Boutheldja', 'Ben Mhidi', 'Besbès', 'Drean', 'Cheffia', 'Bouhadjar', 'Ain El Assel', 'Zitouna']
  },
  {
    code: '37',
    name: 'Tindouf',
    nameAr: 'تندوف',
    cities: ['Tindouf', 'Oum El Assel', 'Hassi Mounir', 'Gara Djebilet', 'Bordj Badji Mokhtar']
  },
  {
    code: '38',
    name: 'Tissemsilt',
    nameAr: 'تيسمسيلت',
    cities: ['Tissemsilt', 'Theniet El Had', 'Bordj Bou Naama', 'Larbaa', 'Beni Chaib', 'Lardjem', 'Ammari', 'Khemisti', 'Lazharia', 'Bordj El Emir Abdelkader']
  },
  {
    code: '39',
    name: 'El Oued',
    nameAr: 'الوادي',
    cities: ['El Oued', 'Robbah', 'Guemar', 'Reguiba', 'Magrane', 'Still', 'Taghzout', 'Debila', 'Hassi Khalifa', 'Kouinine']
  },
  {
    code: '40',
    name: 'Khenchela',
    nameAr: 'خنشلة',
    cities: ['Khenchela', 'Kais', 'Baghai', 'El Hamma', 'Ain Touila', 'Remila', 'El Ouledja', 'Chechar', 'Babar', 'Bouhmama']
  },
  {
    code: '41',
    name: 'Souk Ahras',
    nameAr: 'سوق أهراس',
    cities: ['Souk Ahras', 'Sedrata', 'Hanancha', 'Ouled Moumen', 'Taoura', 'Zaarouria', 'Merahna', 'Mdaourouch', 'Bir Bouhouche', 'Mechroha']
  },
  {
    code: '42',
    name: 'Tipaza',
    nameAr: 'تيبازة',
    cities: ['Tipaza', 'Kolea', 'Cherchell', 'Menaceur', 'Ahmer El Ain', 'Bou Ismail', 'Chaiba', 'Hadjout', 'Fouka', 'Gouraya']
  },
  {
    code: '43',
    name: 'Mila',
    nameAr: 'ميلة',
    cities: ['Mila', 'Ferdjioua', 'Chelghoum Laid', 'Rouached', 'Grarem Gouga', 'Hamala', 'Ain Beida Harriche', 'Tadjenanet', 'Sidi Merouane', 'Oued Endja']
  },
  {
    code: '44',
    name: 'Ain Defla',
    nameAr: 'عين الدفلى',
    cities: ['Ain Defla', 'Khemis Miliana', 'Rouina', 'Djelida', 'El Attaf', 'Arib', 'Miliana', 'El Abadia', 'Hammam Righa', 'Ain Lechiakh']
  },
  {
    code: '45',
    name: 'Naâma',
    nameAr: 'النعامة',
    cities: ['Naâma', 'Mecheria', 'Ain Sefra', 'Tiout', 'Sfissifa', 'Moghrar', 'Assela', 'Kasdir', 'Djeniene Bourezg', 'Ain Ben Khelil']
  },
  {
    code: '46',
    name: 'Ain Témouchent',
    nameAr: 'عين تموشنت',
    cities: ['Ain Témouchent', 'Beni Saf', 'El Malah', 'Hammam Bou Hadjar', 'Ouled Boudjemaa', 'Aghlal', 'El Amria', 'Oulhaca El Gheraba', 'Sidi Ben Adda', 'Terga']
  },
  {
    code: '47',
    name: 'Ghardaïa',
    nameAr: 'غرداية',
    cities: ['Ghardaïa', 'El Meniaa', 'Berriane', 'Metlili', 'El Guerrara', 'Dhayet Ben Dhahoua', 'Sebseb', 'Bounoura', 'Zelfana', 'Mansoura']
  },
  {
    code: '48',
    name: 'Relizane',
    nameAr: 'غليزان',
    cities: ['Relizane', 'Mazouna', 'Oued Rhiou', 'Yellel', 'Sidi Mhamed Ben Ali', 'El Hassi', 'Hamri', 'Djidiouia', 'Ammi Moussa', 'Zemmoura']
  },
  {
    code: '49',
    name: 'Timimoun',
    nameAr: 'تيميمون',
    cities: ['Timimoun', 'Ouled Said', 'Aougrout', 'Deldoul', 'Charouine', 'Metarfa', 'Tinerkouk', 'Ksar Kaddour', 'Talmine']
  },
  {
    code: '50',
    name: 'Bordj Badji Mokhtar',
    nameAr: 'برج باجي مختار',
    cities: ['Bordj Badji Mokhtar', 'Timiaouine', 'Timokten', 'Erg Chegaga', 'Hassi Khebi']
  },
  {
    code: '51',
    name: 'Ouled Djellal',
    nameAr: 'أولاد جلال',
    cities: ['Ouled Djellal', 'Sidi Khaled', 'Doucen', 'Chaiba', 'Besbes', 'Ras El Miaad', 'El Haouita']
  },
  {
    code: '52',
    name: 'Béni Abbès',
    nameAr: 'بني عباس',
    cities: ['Béni Abbès', 'El Ouata', 'Tamtert', 'Igli', 'Kerzaz', 'Timoudi', 'Beni Ikhlef', 'Ksabi']
  },
  {
    code: '53',
    name: 'In Salah',
    nameAr: 'عين صالح',
    cities: ['In Salah', 'Foggaret Ezzaouia', 'In Ghar', 'Ain Ghar', 'Tamekten', 'Zaouiet Kounta']
  },
  {
    code: '54',
    name: 'In Guezzam',
    nameAr: 'عين قزام',
    cities: ['In Guezzam', 'Tin Zaouaten', 'Iherir', 'Tazrouk', 'Arak']
  },
  {
    code: '55',
    name: 'Touggourt',
    nameAr: 'تقرت',
    cities: ['Touggourt', 'Temacine', 'Megarine', 'Sidi Slimane', 'Nezla', 'Zaouia El Abidia', 'Benaceur', 'Tebesbest', 'El Hadjira', 'Taibet']
  },
  {
    code: '56',
    name: 'Djanet',
    nameAr: 'جانت',
    cities: ['Djanet', 'Bordj El Haoues', 'Illizi', 'Iherir', 'Tarat']
  },
  {
    code: '57',
    name: 'El Meghaier',
    nameAr: 'المغير',
    cities: ['El Meghaier', 'Djamaa', 'Sidi Amrane', 'Still', 'Ourmes', 'Tendla', 'Oum Touyour', 'Sidi Khellil']
  },
  {
    code: '58',
    name: 'El Menia',
    nameAr: 'المنيعة',
    cities: ['El Menia', 'Hassi Gara', 'Hassi Fehal', 'Mansoura', 'Ain Ben Khelil', 'Ouargla']
  }
]

// Helper functions
export function getWilayaByCode(code: string): wilaya | undefined {
  return ALGERIA_WILAYAS.find(wilaya => wilaya.code === code)
}

export function getWilayaByName(name: string): wilaya | undefined {
  return ALGERIA_WILAYAS.find(wilaya => 
    wilaya.name.toLowerCase() === name.toLowerCase() || 
    wilaya.nameAr === name
  )
}

export function getCitiesByWilaya(wilayaCode: string): string[] {
  const wilaya = getWilayaByCode(wilayaCode)
  return wilaya ? wilaya.cities : []
}

export function searchWilayas(query: string): wilaya[] {
  const lowerQuery = query.toLowerCase()
  return ALGERIA_WILAYAS.filter(wilaya => 
    wilaya.name.toLowerCase().includes(lowerQuery) ||
    wilaya.nameAr.includes(query) ||
    wilaya.cities.some(city => city.toLowerCase().includes(lowerQuery))
  )
}