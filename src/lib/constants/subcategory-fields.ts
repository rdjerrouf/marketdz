// Single source of truth for subcategory-specific form fields.
// Each entry drives: which fields render in ListingForm, which filters show in browse,
// and which JSONB expression indexes exist in the DB.
// Adding a new subcategory = add one entry here, zero JSX changes.

export type FieldStorage =
  | 'jsonb'
  | 'vehicle_make' | 'vehicle_model' | 'vehicle_year'
  | 'vehicle_mileage' | 'vehicle_transmission' | 'vehicle_fuel_type' | 'vehicle_body_type'

export type FieldType = 'text' | 'integer' | 'select' | 'boolean_select'

export interface FieldOption {
  value: string
  labelKey: string
}

export interface FieldDef {
  key: string
  labelKey: string
  placeholderKey?: string
  selectPlaceholderKey?: string
  type: FieldType
  storage: FieldStorage
  required?: boolean
  searchable?: boolean      // should appear as browse filter
  rangeFilter?: boolean     // filter uses min/max range (not equality)
  fullWidth?: boolean       // spans both grid columns
  dir?: 'ltr' | 'rtl'      // override text direction (always ltr for numbers)
  options?: FieldOption[]
}

export interface SubcategoryConfig {
  category: 'for_sale' | 'for_rent'
  subcategory: string
  sectionTitleKey: string
  fields: FieldDef[]
}

// ── Shared option sets ───────────────────────────────────────────────────────

const TRANSMISSION_OPTIONS: FieldOption[] = [
  { value: 'manual',        labelKey: 'form.transmissionManual' },
  { value: 'automatic',     labelKey: 'form.transmissionAutomatic' },
  { value: 'semi-automatic',labelKey: 'form.transmissionSemiAuto' },
]

const FUEL_OPTIONS: FieldOption[] = [
  { value: 'petrol',   labelKey: 'form.fuelPetrol' },
  { value: 'diesel',   labelKey: 'form.fuelDiesel' },
  { value: 'electric', labelKey: 'form.fuelElectric' },
  { value: 'hybrid',   labelKey: 'form.fuelHybrid' },
  { value: 'lpg',      labelKey: 'form.fuelLpg' },
]

const YES_NO_OPTIONS: FieldOption[] = [
  { value: 'yes', labelKey: 'form.yes' },
  { value: 'no',  labelKey: 'form.no' },
]

const RATE_UNIT_OPTIONS: FieldOption[] = [
  { value: 'per-day',   labelKey: 'form.ratePerDay' },
  { value: 'per-week',  labelKey: 'form.ratePerWeek' },
  { value: 'per-month', labelKey: 'form.ratePerMonth' },
]

const PROPERTY_TYPE_OPTIONS: FieldOption[] = [
  { value: 'apartment',        labelKey: 'form.propApartment' },
  { value: 'house',            labelKey: 'form.propHouse' },
  { value: 'villa',            labelKey: 'form.propVilla' },
  { value: 'land',             labelKey: 'form.propLand' },
  { value: 'agricultural-land',labelKey: 'form.propAgriculturalLand' },
  { value: 'building',         labelKey: 'form.propBuilding' },
  { value: 'studio',           labelKey: 'form.propStudio' },
  { value: 'office',           labelKey: 'form.propOffice' },
  { value: 'commercial',       labelKey: 'form.propCommercial' },
  { value: 'warehouse',        labelKey: 'form.propWarehouse' },
  { value: 'bungalow',         labelKey: 'form.propBungalow' },
  { value: 'other',            labelKey: 'form.bodyOther' },
]

const FURNISHED_OPTIONS: FieldOption[] = [
  { value: 'yes',     labelKey: 'form.furnishedYes' },
  { value: 'partial', labelKey: 'form.furnishedPartial' },
  { value: 'no',      labelKey: 'form.furnishedNo' },
]

const TRUCK_TYPE_OPTIONS: FieldOption[] = [
  { value: 'flatbed',     labelKey: 'form.truckFlatbed' },
  { value: 'tipper',      labelKey: 'form.truckTipper' },
  { value: 'cement-mixer',labelKey: 'form.truckCementMixer' },
  { value: 'crane-truck', labelKey: 'form.truckCrane' },
  { value: 'refrigerated',labelKey: 'form.truckRefrigerated' },
  { value: 'tanker',      labelKey: 'form.truckTanker' },
  { value: 'box-truck',   labelKey: 'form.truckBox' },
  { value: 'other',       labelKey: 'form.bodyOther' },
]

const EQUIPMENT_TYPE_OPTIONS: FieldOption[] = [
  { value: 'excavator', labelKey: 'form.equipmentExcavator' },
  { value: 'bulldozer', labelKey: 'form.equipmentBulldozer' },
  { value: 'loader',    labelKey: 'form.equipmentLoader' },
  { value: 'crane',     labelKey: 'form.equipmentCrane' },
  { value: 'forklift',  labelKey: 'form.equipmentForklift' },
  { value: 'generator', labelKey: 'form.equipmentGenerator' },
  { value: 'compactor', labelKey: 'form.equipmentCompactor' },
  { value: 'grader',    labelKey: 'form.equipmentGrader' },
  { value: 'other',     labelKey: 'form.bodyOther' },
]

// ── For Sale ─────────────────────────────────────────────────────────────────

const FOR_SALE_CONFIGS: SubcategoryConfig[] = [
  {
    category: 'for_sale',
    subcategory: 'Vehicles',
    sectionTitleKey: 'form.vehicleDetails',
    fields: [
      { key: 'vehicle_make', labelKey: 'form.vehicleMake', placeholderKey: 'form.vehicleMakePlaceholder', type: 'text', storage: 'vehicle_make', searchable: true, dir: 'ltr' },
      { key: 'vehicle_model', labelKey: 'form.vehicleModel', placeholderKey: 'form.vehicleModelPlaceholder', type: 'text', storage: 'vehicle_model', searchable: true, dir: 'ltr' },
      { key: 'vehicle_year', labelKey: 'form.vehicleYear', placeholderKey: 'form.vehicleYearPlaceholder', type: 'integer', storage: 'vehicle_year', searchable: true, rangeFilter: true, dir: 'ltr' },
      { key: 'vehicle_mileage', labelKey: 'form.vehicleMileage', placeholderKey: 'form.vehicleMileagePlaceholder', type: 'integer', storage: 'vehicle_mileage', searchable: true, rangeFilter: true, dir: 'ltr' },
      { key: 'vehicle_transmission', labelKey: 'form.vehicleTransmission', selectPlaceholderKey: 'form.selectVehicleTransmission', type: 'select', storage: 'vehicle_transmission', searchable: true, options: TRANSMISSION_OPTIONS },
      { key: 'vehicle_fuel_type', labelKey: 'form.vehicleFuelType', selectPlaceholderKey: 'form.selectVehicleFuelType', type: 'select', storage: 'vehicle_fuel_type', searchable: true, options: FUEL_OPTIONS },
      { key: 'vehicle_body_type', labelKey: 'form.vehicleBodyType', selectPlaceholderKey: 'form.selectVehicleBodyType', type: 'select', storage: 'vehicle_body_type', searchable: true, options: [
        { value: 'sedan',      labelKey: 'form.bodySedan' },
        { value: 'suv',        labelKey: 'form.bodySuv' },
        { value: 'hatchback',  labelKey: 'form.bodyHatchback' },
        { value: 'pickup',     labelKey: 'form.bodyPickup' },
        { value: 'van',        labelKey: 'form.bodyVan' },
        { value: 'coupe',      labelKey: 'form.bodyCoupe' },
        { value: 'wagon',      labelKey: 'form.bodyWagon' },
        { value: 'convertible',labelKey: 'form.bodyConvertible' },
        { value: 'minivan',    labelKey: 'form.bodyMinivan' },
        { value: 'other',      labelKey: 'form.bodyOther' },
      ]},
      { key: 'engine_spec', labelKey: 'form.engineSpec', placeholderKey: 'form.engineSpecPlaceholder', type: 'text', storage: 'jsonb', searchable: false, dir: 'ltr' },
    ],
  },
  {
    category: 'for_sale',
    subcategory: 'Motorcycles',
    sectionTitleKey: 'form.motoDetails',
    fields: [
      { key: 'vehicle_make', labelKey: 'form.vehicleMake', placeholderKey: 'form.vehicleMakePlaceholder', type: 'text', storage: 'vehicle_make', searchable: true, dir: 'ltr' },
      { key: 'vehicle_model', labelKey: 'form.vehicleModel', placeholderKey: 'form.vehicleModelPlaceholder', type: 'text', storage: 'vehicle_model', searchable: true, dir: 'ltr' },
      { key: 'vehicle_year', labelKey: 'form.vehicleYear', placeholderKey: 'form.vehicleYearPlaceholder', type: 'integer', storage: 'vehicle_year', searchable: true, rangeFilter: true, dir: 'ltr' },
      { key: 'vehicle_mileage', labelKey: 'form.vehicleMileage', placeholderKey: 'form.vehicleMileagePlaceholder', type: 'integer', storage: 'vehicle_mileage', searchable: true, rangeFilter: true, dir: 'ltr' },
      { key: 'moto_type', labelKey: 'form.motoType', selectPlaceholderKey: 'form.selectMotoType', type: 'select', storage: 'jsonb', searchable: true, options: [
        { value: 'sport',   labelKey: 'form.motoSport' },
        { value: 'cruiser', labelKey: 'form.motoCruiser' },
        { value: 'scooter', labelKey: 'form.motoScooter' },
        { value: 'enduro',  labelKey: 'form.motoEnduro' },
        { value: 'naked',   labelKey: 'form.motoNaked' },
        { value: 'other',   labelKey: 'form.bodyOther' },
      ]},
      { key: 'engine_cc', labelKey: 'form.engineCc', placeholderKey: 'form.engineCcPlaceholder', type: 'integer', storage: 'jsonb', searchable: true, rangeFilter: true, dir: 'ltr' },
      { key: 'vehicle_transmission', labelKey: 'form.vehicleTransmission', selectPlaceholderKey: 'form.selectVehicleTransmission', type: 'select', storage: 'vehicle_transmission', searchable: true, options: TRANSMISSION_OPTIONS },
      { key: 'vehicle_fuel_type', labelKey: 'form.vehicleFuelType', selectPlaceholderKey: 'form.selectVehicleFuelType', type: 'select', storage: 'vehicle_fuel_type', searchable: true, options: [
        { value: 'petrol',   labelKey: 'form.fuelPetrol' },
        { value: 'electric', labelKey: 'form.fuelElectric' },
        { value: 'hybrid',   labelKey: 'form.fuelHybrid' },
        { value: 'lpg',      labelKey: 'form.fuelLpg' },
      ]},
    ],
  },
  {
    category: 'for_sale',
    subcategory: 'Auto & Motorcycle Parts',
    sectionTitleKey: 'form.autoPartsDetails',
    fields: [
      { key: 'part_category', labelKey: 'form.partCategory', selectPlaceholderKey: 'form.selectPartCategory', type: 'select', storage: 'jsonb', searchable: true, options: [
        { value: 'engine',       labelKey: 'form.partEngine' },
        { value: 'electrical',   labelKey: 'form.partElectrical' },
        { value: 'body',         labelKey: 'form.partBody' },
        { value: 'suspension',   labelKey: 'form.partSuspension' },
        { value: 'brakes',       labelKey: 'form.partBrakes' },
        { value: 'interior',     labelKey: 'form.partInterior' },
        { value: 'lighting',     labelKey: 'form.partLighting' },
        { value: 'tires-wheels', labelKey: 'form.partTiresWheels' },
        { value: 'exhaust',      labelKey: 'form.partExhaust' },
        { value: 'transmission', labelKey: 'form.partTransmission' },
        { value: 'other',        labelKey: 'form.bodyOther' },
      ]},
    ],
  },
  {
    category: 'for_sale',
    subcategory: 'Construction Vehicles & Trucks',
    sectionTitleKey: 'form.truckDetails',
    fields: [
      { key: 'vehicle_make', labelKey: 'form.vehicleMake', placeholderKey: 'form.vehicleMakePlaceholder', type: 'text', storage: 'vehicle_make', searchable: true, dir: 'ltr' },
      { key: 'vehicle_year', labelKey: 'form.vehicleYear', placeholderKey: 'form.vehicleYearPlaceholder', type: 'integer', storage: 'vehicle_year', searchable: true, rangeFilter: true, dir: 'ltr' },
      { key: 'vehicle_mileage', labelKey: 'form.vehicleMileage', placeholderKey: 'form.vehicleMileagePlaceholder', type: 'integer', storage: 'vehicle_mileage', searchable: true, rangeFilter: true, dir: 'ltr' },
      { key: 'vehicle_fuel_type', labelKey: 'form.vehicleFuelType', selectPlaceholderKey: 'form.selectVehicleFuelType', type: 'select', storage: 'vehicle_fuel_type', searchable: true, options: [
        { value: 'petrol',   labelKey: 'form.fuelPetrol' },
        { value: 'diesel',   labelKey: 'form.fuelDiesel' },
        { value: 'electric', labelKey: 'form.fuelElectric' },
        { value: 'lpg',      labelKey: 'form.fuelLpg' },
      ]},
      { key: 'truck_type', labelKey: 'form.truckType', selectPlaceholderKey: 'form.selectTruckType', type: 'select', storage: 'jsonb', searchable: true, options: TRUCK_TYPE_OPTIONS },
      { key: 'payload_capacity_kg', labelKey: 'form.payloadCapacity', placeholderKey: 'form.payloadCapacityPlaceholder', type: 'integer', storage: 'jsonb', searchable: true, rangeFilter: true, dir: 'ltr' },
    ],
  },
  {
    category: 'for_sale',
    subcategory: 'Heavy Equipment & Machinery',
    sectionTitleKey: 'form.equipmentDetails',
    fields: [
      { key: 'vehicle_make', labelKey: 'form.vehicleMake', placeholderKey: 'form.vehicleMakePlaceholder', type: 'text', storage: 'vehicle_make', searchable: true, dir: 'ltr' },
      { key: 'vehicle_year', labelKey: 'form.vehicleYear', placeholderKey: 'form.vehicleYearPlaceholder', type: 'integer', storage: 'vehicle_year', searchable: true, rangeFilter: true, dir: 'ltr' },
      { key: 'equipment_type', labelKey: 'form.equipmentType', selectPlaceholderKey: 'form.selectEquipmentType', type: 'select', storage: 'jsonb', searchable: true, options: EQUIPMENT_TYPE_OPTIONS },
      { key: 'hours_used', labelKey: 'form.hoursUsed', placeholderKey: 'form.hoursUsedPlaceholder', type: 'integer', storage: 'jsonb', searchable: true, rangeFilter: true, dir: 'ltr' },
      { key: 'engine_power_kw', labelKey: 'form.enginePowerKw', placeholderKey: 'form.enginePowerKwPlaceholder', type: 'integer', storage: 'jsonb', searchable: false, dir: 'ltr' },
    ],
  },
  {
    category: 'for_sale',
    subcategory: 'Construction Materials & Supplies',
    sectionTitleKey: 'form.constructionMaterialsDetails',
    fields: [
      { key: 'material_type', labelKey: 'form.materialType', selectPlaceholderKey: 'form.selectMaterialType', type: 'select', storage: 'jsonb', searchable: true, options: [
        { value: 'cement',      labelKey: 'form.matCement' },
        { value: 'steel',       labelKey: 'form.matSteel' },
        { value: 'brick',       labelKey: 'form.matBrick' },
        { value: 'tile',        labelKey: 'form.matTile' },
        { value: 'wood',        labelKey: 'form.matWood' },
        { value: 'paint',       labelKey: 'form.matPaint' },
        { value: 'glass',       labelKey: 'form.matGlass' },
        { value: 'insulation',  labelKey: 'form.matInsulation' },
        { value: 'plumbing',    labelKey: 'form.matPlumbing' },
        { value: 'electrical',  labelKey: 'form.matElectrical' },
        { value: 'other',       labelKey: 'form.bodyOther' },
      ]},
      { key: 'brand', labelKey: 'form.brand', placeholderKey: 'form.brandPlaceholder', type: 'text', storage: 'jsonb', searchable: true },
      { key: 'unit', labelKey: 'form.unit', selectPlaceholderKey: 'form.selectUnit', type: 'select', storage: 'jsonb', searchable: false, options: [
        { value: 'bag',   labelKey: 'form.unitBag' },
        { value: 'ton',   labelKey: 'form.unitTon' },
        { value: 'm2',    labelKey: 'form.unitM2' },
        { value: 'piece', labelKey: 'form.unitPiece' },
        { value: 'liter', labelKey: 'form.unitLiter' },
        { value: 'meter', labelKey: 'form.unitMeter' },
        { value: 'other', labelKey: 'form.bodyOther' },
      ]},
    ],
  },
  {
    category: 'for_sale',
    subcategory: 'Real Estate',
    sectionTitleKey: 'form.realEstateDetails',
    fields: [
      { key: 'property_type', labelKey: 'form.propertyType', selectPlaceholderKey: 'form.selectPropertyType', type: 'select', storage: 'jsonb', searchable: true, options: PROPERTY_TYPE_OPTIONS },
      { key: 'bedrooms', labelKey: 'form.bedrooms', placeholderKey: 'form.bedroomsPlaceholder', type: 'integer', storage: 'jsonb', searchable: true, rangeFilter: true, dir: 'ltr' },
      { key: 'bathrooms', labelKey: 'form.bathrooms', placeholderKey: 'form.bathroomsPlaceholder', type: 'integer', storage: 'jsonb', searchable: false, dir: 'ltr' },
      { key: 'size_sqm', labelKey: 'form.sizeSqm', placeholderKey: 'form.sizeSqmPlaceholder', type: 'integer', storage: 'jsonb', searchable: true, rangeFilter: true, dir: 'ltr' },
      { key: 'floor', labelKey: 'form.floor', placeholderKey: 'form.floorPlaceholder', type: 'integer', storage: 'jsonb', searchable: true, dir: 'ltr' },
      { key: 'furnished', labelKey: 'form.furnished', selectPlaceholderKey: 'form.selectFurnished', type: 'select', storage: 'jsonb', searchable: true, options: FURNISHED_OPTIONS },
      { key: 'parking', labelKey: 'form.parking', selectPlaceholderKey: 'form.selectParking', type: 'boolean_select', storage: 'jsonb', searchable: true, options: YES_NO_OPTIONS },
      { key: 'finishing', labelKey: 'form.finishing', selectPlaceholderKey: 'form.selectFinishing', type: 'select', storage: 'jsonb', searchable: true, options: [
        { value: 'raw',           labelKey: 'form.finishingRaw' },
        { value: 'semi-finished', labelKey: 'form.finishingSemi' },
        { value: 'finished',      labelKey: 'form.finishingFinished' },
        { value: 'luxury',        labelKey: 'form.finishingLuxury' },
      ]},
    ],
  },
  {
    category: 'for_sale',
    subcategory: 'Phones & Accessories',
    sectionTitleKey: 'form.productDetails',
    fields: [
      { key: 'brand', labelKey: 'form.brand', placeholderKey: 'form.brandPlaceholder', type: 'text', storage: 'jsonb', searchable: true },
      { key: 'model_name', labelKey: 'form.modelName', placeholderKey: 'form.modelNamePlaceholder', type: 'text', storage: 'jsonb', searchable: true },
      { key: 'storage_gb', labelKey: 'form.storage', placeholderKey: 'form.storagePlaceholder', type: 'text', storage: 'jsonb', searchable: true, dir: 'ltr' },
      { key: 'color', labelKey: 'form.color', placeholderKey: 'form.colorPlaceholder', type: 'text', storage: 'jsonb', searchable: false },
    ],
  },
  {
    category: 'for_sale',
    subcategory: 'Electronics & Computers',
    sectionTitleKey: 'form.productDetails',
    fields: [
      { key: 'brand', labelKey: 'form.brand', placeholderKey: 'form.brandPlaceholder', type: 'text', storage: 'jsonb', searchable: true },
      { key: 'model_name', labelKey: 'form.modelName', placeholderKey: 'form.modelNamePlaceholder', type: 'text', storage: 'jsonb', searchable: true },
      { key: 'screen_size', labelKey: 'form.screenSize', placeholderKey: 'form.screenSizePlaceholder', type: 'text', storage: 'jsonb', searchable: true, dir: 'ltr' },
      { key: 'processor', labelKey: 'form.processor', placeholderKey: 'form.processorPlaceholder', type: 'text', storage: 'jsonb', searchable: true },
      { key: 'ram_gb', labelKey: 'form.ramGb', placeholderKey: 'form.ramGbPlaceholder', type: 'text', storage: 'jsonb', searchable: true, dir: 'ltr' },
      { key: 'storage_gb', labelKey: 'form.storage', placeholderKey: 'form.storagePlaceholder', type: 'text', storage: 'jsonb', searchable: true, dir: 'ltr' },
      { key: 'dedicated_gpu', labelKey: 'form.dedicatedGpu', selectPlaceholderKey: 'form.selectOption', type: 'boolean_select', storage: 'jsonb', searchable: true, options: YES_NO_OPTIONS },
    ],
  },
  {
    category: 'for_sale',
    subcategory: 'Home Appliances',
    sectionTitleKey: 'form.productDetails',
    fields: [
      { key: 'brand', labelKey: 'form.brand', placeholderKey: 'form.brandPlaceholder', type: 'text', storage: 'jsonb', searchable: true },
      { key: 'appliance_type', labelKey: 'form.applianceType', selectPlaceholderKey: 'form.selectApplianceType', type: 'select', storage: 'jsonb', searchable: true, options: [
        { value: 'fridge',          labelKey: 'form.appFridge' },
        { value: 'washing-machine', labelKey: 'form.appWashingMachine' },
        { value: 'oven',            labelKey: 'form.appOven' },
        { value: 'air-conditioner', labelKey: 'form.appAirConditioner' },
        { value: 'television',      labelKey: 'form.appTelevision' },
        { value: 'vacuum',          labelKey: 'form.appVacuum' },
        { value: 'other',           labelKey: 'form.bodyOther' },
      ]},
    ],
  },
  {
    category: 'for_sale',
    subcategory: 'Furniture & Home Decor',
    sectionTitleKey: 'form.productDetails',
    fields: [
      { key: 'brand', labelKey: 'form.brand', placeholderKey: 'form.brandPlaceholder', type: 'text', storage: 'jsonb', searchable: true },
      { key: 'material', labelKey: 'form.material', placeholderKey: 'form.materialPlaceholder', type: 'text', storage: 'jsonb', searchable: false },
      { key: 'color', labelKey: 'form.color', placeholderKey: 'form.colorPlaceholder', type: 'text', storage: 'jsonb', searchable: false },
      { key: 'dimensions', labelKey: 'form.dimensions', placeholderKey: 'form.dimensionsPlaceholder', type: 'text', storage: 'jsonb', searchable: false },
    ],
  },
  {
    category: 'for_sale',
    subcategory: 'Fashion & Clothing',
    sectionTitleKey: 'form.fashionDetails',
    fields: [
      { key: 'brand', labelKey: 'form.brand', placeholderKey: 'form.brandPlaceholder', type: 'text', storage: 'jsonb', searchable: true },
      { key: 'size', labelKey: 'form.size', placeholderKey: 'form.sizePlaceholder', type: 'text', storage: 'jsonb', searchable: true, dir: 'ltr' },
      { key: 'gender', labelKey: 'form.gender', selectPlaceholderKey: 'form.selectGender', type: 'select', storage: 'jsonb', searchable: true, options: [
        { value: 'men',   labelKey: 'form.genderMen' },
        { value: 'women', labelKey: 'form.genderWomen' },
        { value: 'kids',  labelKey: 'form.genderKids' },
        { value: 'unisex',labelKey: 'form.genderUnisex' },
      ]},
      { key: 'color', labelKey: 'form.color', placeholderKey: 'form.colorPlaceholder', type: 'text', storage: 'jsonb', searchable: false },
      { key: 'material', labelKey: 'form.material', placeholderKey: 'form.materialPlaceholder', type: 'text', storage: 'jsonb', searchable: false },
    ],
  },
  {
    category: 'for_sale',
    subcategory: 'Baby & Kids',
    sectionTitleKey: 'form.productDetails',
    fields: [
      { key: 'brand', labelKey: 'form.brand', placeholderKey: 'form.brandPlaceholder', type: 'text', storage: 'jsonb', searchable: true },
      { key: 'age_range', labelKey: 'form.ageRange', selectPlaceholderKey: 'form.selectAgeRange', type: 'select', storage: 'jsonb', searchable: true, options: [
        { value: '0-6m',  labelKey: 'form.age0to6m' },
        { value: '6-12m', labelKey: 'form.age6to12m' },
        { value: '1-2y',  labelKey: 'form.age1to2y' },
        { value: '2-4y',  labelKey: 'form.age2to4y' },
        { value: '4-6y',  labelKey: 'form.age4to6y' },
        { value: '6-8y',  labelKey: 'form.age6to8y' },
        { value: '8-12y', labelKey: 'form.age8to12y' },
        { value: '12y+',  labelKey: 'form.age12yPlus' },
      ]},
    ],
  },
  {
    category: 'for_sale',
    subcategory: 'Sports & Outdoors',
    sectionTitleKey: 'form.productDetails',
    fields: [
      { key: 'brand', labelKey: 'form.brand', placeholderKey: 'form.brandPlaceholder', type: 'text', storage: 'jsonb', searchable: true },
      { key: 'sport_type', labelKey: 'form.sportType', selectPlaceholderKey: 'form.selectSportType', type: 'select', storage: 'jsonb', searchable: true, options: [
        { value: 'football',     labelKey: 'form.sportFootball' },
        { value: 'basketball',   labelKey: 'form.sportBasketball' },
        { value: 'tennis',       labelKey: 'form.sportTennis' },
        { value: 'swimming',     labelKey: 'form.sportSwimming' },
        { value: 'cycling',      labelKey: 'form.sportCycling' },
        { value: 'gym',          labelKey: 'form.sportGym' },
        { value: 'running',      labelKey: 'form.sportRunning' },
        { value: 'martial-arts', labelKey: 'form.sportMartialArts' },
        { value: 'other',        labelKey: 'form.bodyOther' },
      ]},
    ],
  },
  {
    category: 'for_sale',
    subcategory: 'Books & Media',
    sectionTitleKey: 'form.booksDetails',
    fields: [
      { key: 'author', labelKey: 'form.author', placeholderKey: 'form.authorPlaceholder', type: 'text', storage: 'jsonb', searchable: false, fullWidth: true },
      { key: 'book_language', labelKey: 'form.bookLanguage', selectPlaceholderKey: 'form.selectLanguage', type: 'select', storage: 'jsonb', searchable: true, options: [
        { value: 'arabic',  labelKey: 'form.langArabic' },
        { value: 'french',  labelKey: 'form.langFrench' },
        { value: 'english', labelKey: 'form.langEnglish' },
        { value: 'other',   labelKey: 'form.langOther' },
      ]},
      { key: 'genre', labelKey: 'form.genre', placeholderKey: 'form.genrePlaceholder', type: 'text', storage: 'jsonb', searchable: true },
    ],
  },
  {
    category: 'for_sale',
    subcategory: 'Tools & Equipment',
    sectionTitleKey: 'form.productDetails',
    fields: [
      { key: 'brand', labelKey: 'form.brand', placeholderKey: 'form.brandPlaceholder', type: 'text', storage: 'jsonb', searchable: true },
      { key: 'tool_type', labelKey: 'form.toolType', selectPlaceholderKey: 'form.selectToolType', type: 'select', storage: 'jsonb', searchable: true, options: [
        { value: 'power-tool',  labelKey: 'form.toolPower' },
        { value: 'hand-tool',   labelKey: 'form.toolHand' },
        { value: 'measuring',   labelKey: 'form.toolMeasuring' },
        { value: 'welding',     labelKey: 'form.toolWelding' },
        { value: 'other',       labelKey: 'form.bodyOther' },
      ]},
      { key: 'power_source', labelKey: 'form.powerSource', selectPlaceholderKey: 'form.selectPowerSource', type: 'select', storage: 'jsonb', searchable: true, options: [
        { value: 'electric',   labelKey: 'form.powerElectric' },
        { value: 'battery',    labelKey: 'form.powerBattery' },
        { value: 'pneumatic',  labelKey: 'form.powerPneumatic' },
        { value: 'manual',     labelKey: 'form.powerManual' },
        { value: 'fuel',       labelKey: 'form.powerFuel' },
      ]},
    ],
  },
  {
    category: 'for_sale',
    subcategory: 'Agriculture',
    sectionTitleKey: 'form.productDetails',
    fields: [
      { key: 'brand', labelKey: 'form.brand', placeholderKey: 'form.brandPlaceholder', type: 'text', storage: 'jsonb', searchable: true },
      { key: 'product_type', labelKey: 'form.productType', selectPlaceholderKey: 'form.selectProductType', type: 'select', storage: 'jsonb', searchable: true, options: [
        { value: 'seeds',      labelKey: 'form.agriSeeds' },
        { value: 'fertilizer', labelKey: 'form.agriFertilizer' },
        { value: 'pesticide',  labelKey: 'form.agriPesticide' },
        { value: 'equipment',  labelKey: 'form.agriEquipment' },
        { value: 'livestock',  labelKey: 'form.agriLivestock' },
        { value: 'other',      labelKey: 'form.bodyOther' },
      ]},
    ],
  },
]

// ── For Rent ─────────────────────────────────────────────────────────────────

const FOR_RENT_CONFIGS: SubcategoryConfig[] = [
  {
    category: 'for_rent',
    subcategory: 'Apartments',
    sectionTitleKey: 'form.propertyRentDetails',
    fields: [
      { key: 'property_type', labelKey: 'form.propertyType', selectPlaceholderKey: 'form.selectPropertyType', type: 'select', storage: 'jsonb', searchable: true, options: [
        { value: 'apartment', labelKey: 'form.propApartment' },
        { value: 'studio',    labelKey: 'form.propStudio' },
        { value: 'other',     labelKey: 'form.bodyOther' },
      ]},
      { key: 'furnished', labelKey: 'form.furnished', selectPlaceholderKey: 'form.selectFurnished', type: 'select', storage: 'jsonb', searchable: true, options: FURNISHED_OPTIONS },
      { key: 'bedrooms', labelKey: 'form.bedrooms', placeholderKey: 'form.bedroomsPlaceholder', type: 'integer', storage: 'jsonb', searchable: true, rangeFilter: true, dir: 'ltr' },
      { key: 'bathrooms', labelKey: 'form.bathrooms', placeholderKey: 'form.bathroomsPlaceholder', type: 'integer', storage: 'jsonb', searchable: false, dir: 'ltr' },
      { key: 'size_sqm', labelKey: 'form.sizeSqm', placeholderKey: 'form.sizeSqmPlaceholder', type: 'integer', storage: 'jsonb', searchable: true, rangeFilter: true, dir: 'ltr' },
      { key: 'floor', labelKey: 'form.floor', placeholderKey: 'form.floorPlaceholder', type: 'integer', storage: 'jsonb', searchable: true, dir: 'ltr' },
      { key: 'parking', labelKey: 'form.parking', selectPlaceholderKey: 'form.selectParking', type: 'boolean_select', storage: 'jsonb', searchable: true, options: YES_NO_OPTIONS },
    ],
  },
  {
    category: 'for_rent',
    subcategory: 'Houses',
    sectionTitleKey: 'form.propertyRentDetails',
    fields: [
      { key: 'property_type', labelKey: 'form.propertyType', selectPlaceholderKey: 'form.selectPropertyType', type: 'select', storage: 'jsonb', searchable: true, options: [
        { value: 'house',  labelKey: 'form.propHouse' },
        { value: 'villa',  labelKey: 'form.propVilla' },
        { value: 'other',  labelKey: 'form.bodyOther' },
      ]},
      { key: 'furnished', labelKey: 'form.furnished', selectPlaceholderKey: 'form.selectFurnished', type: 'select', storage: 'jsonb', searchable: true, options: FURNISHED_OPTIONS },
      { key: 'bedrooms', labelKey: 'form.bedrooms', placeholderKey: 'form.bedroomsPlaceholder', type: 'integer', storage: 'jsonb', searchable: true, rangeFilter: true, dir: 'ltr' },
      { key: 'bathrooms', labelKey: 'form.bathrooms', placeholderKey: 'form.bathroomsPlaceholder', type: 'integer', storage: 'jsonb', searchable: false, dir: 'ltr' },
      { key: 'size_sqm', labelKey: 'form.sizeSqm', placeholderKey: 'form.sizeSqmPlaceholder', type: 'integer', storage: 'jsonb', searchable: true, rangeFilter: true, dir: 'ltr' },
      { key: 'floor', labelKey: 'form.floor', placeholderKey: 'form.floorPlaceholder', type: 'integer', storage: 'jsonb', searchable: false, dir: 'ltr' },
      { key: 'parking', labelKey: 'form.parking', selectPlaceholderKey: 'form.selectParking', type: 'boolean_select', storage: 'jsonb', searchable: true, options: YES_NO_OPTIONS },
    ],
  },
  {
    category: 'for_rent',
    subcategory: 'Offices',
    sectionTitleKey: 'form.commercialRentDetails',
    fields: [
      { key: 'usage_type', labelKey: 'form.usageType', selectPlaceholderKey: 'form.selectUsageType', type: 'select', storage: 'jsonb', searchable: true, options: [
        { value: 'office',     labelKey: 'form.usageOffice' },
        { value: 'coworking',  labelKey: 'form.usageCoworking' },
        { value: 'other',      labelKey: 'form.bodyOther' },
      ]},
      { key: 'size_sqm', labelKey: 'form.sizeSqm', placeholderKey: 'form.sizeSqmPlaceholder', type: 'integer', storage: 'jsonb', searchable: true, rangeFilter: true, dir: 'ltr' },
      { key: 'floor', labelKey: 'form.floor', placeholderKey: 'form.floorPlaceholder', type: 'integer', storage: 'jsonb', searchable: true, dir: 'ltr' },
      { key: 'parking', labelKey: 'form.parking', selectPlaceholderKey: 'form.selectParking', type: 'boolean_select', storage: 'jsonb', searchable: true, options: YES_NO_OPTIONS },
    ],
  },
  {
    category: 'for_rent',
    subcategory: 'Commercial Space',
    sectionTitleKey: 'form.commercialRentDetails',
    fields: [
      { key: 'usage_type', labelKey: 'form.usageType', selectPlaceholderKey: 'form.selectUsageType', type: 'select', storage: 'jsonb', searchable: true, options: [
        { value: 'retail',      labelKey: 'form.usageRetail' },
        { value: 'warehouse',   labelKey: 'form.usageWarehouse' },
        { value: 'restaurant',  labelKey: 'form.usageRestaurant' },
        { value: 'clinic',      labelKey: 'form.usageClinic' },
        { value: 'other',       labelKey: 'form.bodyOther' },
      ]},
      { key: 'size_sqm', labelKey: 'form.sizeSqm', placeholderKey: 'form.sizeSqmPlaceholder', type: 'integer', storage: 'jsonb', searchable: true, rangeFilter: true, dir: 'ltr' },
      { key: 'floor', labelKey: 'form.floor', placeholderKey: 'form.floorPlaceholder', type: 'integer', storage: 'jsonb', searchable: false, dir: 'ltr' },
      { key: 'parking', labelKey: 'form.parking', selectPlaceholderKey: 'form.selectParking', type: 'boolean_select', storage: 'jsonb', searchable: true, options: YES_NO_OPTIONS },
    ],
  },
  {
    category: 'for_rent',
    subcategory: 'Event Halls (Salle des Fêtes)',
    sectionTitleKey: 'form.eventHallDetails',
    fields: [
      { key: 'capacity_persons', labelKey: 'form.capacityPersons', placeholderKey: 'form.capacityPersonsPlaceholder', type: 'integer', storage: 'jsonb', searchable: true, rangeFilter: true, dir: 'ltr' },
      { key: 'size_sqm', labelKey: 'form.sizeSqm', placeholderKey: 'form.sizeSqmPlaceholder', type: 'integer', storage: 'jsonb', searchable: false, dir: 'ltr' },
      { key: 'catering_included', labelKey: 'form.cateringIncluded', selectPlaceholderKey: 'form.selectOption', type: 'boolean_select', storage: 'jsonb', searchable: true, options: YES_NO_OPTIONS },
      { key: 'parking', labelKey: 'form.parking', selectPlaceholderKey: 'form.selectParking', type: 'boolean_select', storage: 'jsonb', searchable: true, options: YES_NO_OPTIONS },
    ],
  },
  {
    category: 'for_rent',
    subcategory: 'Vehicles',
    sectionTitleKey: 'form.vehicleRentDetails',
    fields: [
      { key: 'vehicle_make', labelKey: 'form.vehicleMake', placeholderKey: 'form.vehicleMakePlaceholder', type: 'text', storage: 'vehicle_make', searchable: true, dir: 'ltr' },
      { key: 'vehicle_model', labelKey: 'form.vehicleModel', placeholderKey: 'form.vehicleModelPlaceholder', type: 'text', storage: 'vehicle_model', searchable: true, dir: 'ltr' },
      { key: 'vehicle_year', labelKey: 'form.vehicleYear', placeholderKey: 'form.vehicleYearPlaceholder', type: 'integer', storage: 'vehicle_year', searchable: true, rangeFilter: true, dir: 'ltr' },
      { key: 'vehicle_transmission', labelKey: 'form.vehicleTransmission', selectPlaceholderKey: 'form.selectVehicleTransmission', type: 'select', storage: 'vehicle_transmission', searchable: true, options: TRANSMISSION_OPTIONS },
      { key: 'vehicle_fuel_type', labelKey: 'form.vehicleFuelType', selectPlaceholderKey: 'form.selectVehicleFuelType', type: 'select', storage: 'vehicle_fuel_type', searchable: true, options: FUEL_OPTIONS },
      { key: 'rate_unit', labelKey: 'form.rateUnit', selectPlaceholderKey: 'form.selectRateUnit', type: 'select', storage: 'jsonb', searchable: true, options: RATE_UNIT_OPTIONS },
      { key: 'deposit_required', labelKey: 'form.depositRequired', selectPlaceholderKey: 'form.selectOption', type: 'boolean_select', storage: 'jsonb', searchable: true, options: YES_NO_OPTIONS },
      { key: 'driver_included', labelKey: 'form.driverIncluded', selectPlaceholderKey: 'form.selectOption', type: 'boolean_select', storage: 'jsonb', searchable: true, options: YES_NO_OPTIONS },
      { key: 'mileage_limit_km', labelKey: 'form.mileageLimitKm', placeholderKey: 'form.mileageLimitKmPlaceholder', type: 'integer', storage: 'jsonb', searchable: false, dir: 'ltr' },
    ],
  },
  {
    category: 'for_rent',
    subcategory: 'Equipment',
    sectionTitleKey: 'form.equipmentRentDetails',
    fields: [
      { key: 'equipment_type', labelKey: 'form.equipmentType', selectPlaceholderKey: 'form.selectEquipmentType', type: 'select', storage: 'jsonb', searchable: true, options: EQUIPMENT_TYPE_OPTIONS },
      { key: 'brand', labelKey: 'form.brand', placeholderKey: 'form.brandPlaceholder', type: 'text', storage: 'jsonb', searchable: true },
      { key: 'rate_unit', labelKey: 'form.rateUnit', selectPlaceholderKey: 'form.selectRateUnit', type: 'select', storage: 'jsonb', searchable: true, options: RATE_UNIT_OPTIONS },
      { key: 'deposit_required', labelKey: 'form.depositRequired', selectPlaceholderKey: 'form.selectOption', type: 'boolean_select', storage: 'jsonb', searchable: true, options: YES_NO_OPTIONS },
    ],
  },
]

// ── Lookup map ───────────────────────────────────────────────────────────────

const ALL_CONFIGS: SubcategoryConfig[] = [...FOR_SALE_CONFIGS, ...FOR_RENT_CONFIGS]

const CONFIG_MAP = new Map<string, SubcategoryConfig>(
  ALL_CONFIGS.map(c => [`${c.category}::${c.subcategory}`, c])
)

export function getSubcategoryConfig(category: string, subcategory: string): SubcategoryConfig | null {
  return CONFIG_MAP.get(`${category}::${subcategory}`) ?? null
}

export function hasSubcategoryConfig(category: string, subcategory: string): boolean {
  return CONFIG_MAP.has(`${category}::${subcategory}`)
}

export { FOR_SALE_CONFIGS, FOR_RENT_CONFIGS, ALL_CONFIGS }
