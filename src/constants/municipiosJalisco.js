export const municipiosJalisco = [
  'Acatic',
  'Acatlan de Juarez',
  'Ahualulco de Mercado',
  'Amacueca',
  'Amatitan',
  'Ameca',
  'Arandas',
  'Atemajac de Brizuela',
  'Atengo',
  'Atenguillo',
  'Atotonilco el Alto',
  'Atoyac',
  'Autlan de Navarro',
  'Ayotlan',
  'Ayutla',
  'Bolanos',
  'Cabo Corrientes',
  'Canadas de Obregon',
  'Casimiro Castillo',
  'Chapala',
  'Chimaltitan',
  'Chiquilistlan',
  'Cihuatlan',
  'Cocula',
  'Colotlan',
  'Concepcion de Buenos Aires',
  'Cuautitlan de Garcia Barragan',
  'Cuautla',
  'Cuquio',
  'Degollado',
  'Ejutla',
  'El Arenal',
  'El Grullo',
  'El Limon',
  'El Salto',
  'Encarnacion de Diaz',
  'Etzatlan',
  'Gomez Farias',
  'Guachinango',
  'Guadalajara',
  'Hostotipaquillo',
  'Huejucar',
  'Huejuquilla el Alto',
  'Ixtlahuacan de los Membrillos',
  'Ixtlahuacan del Rio',
  'Jalostotitlan',
  'Jamay',
  'Jesus Maria',
  'Jilotlan de los Dolores',
  'Jocotepec',
  'Juanacatlan',
  'Juchitlan',
  'La Barca',
  'La Huerta',
  'La Manzanilla de la Paz',
  'Lagos de Moreno',
  'Magdalena',
  'Mascota',
  'Mazamitla',
  'Mexticacan',
  'Mezquitic',
  'Mixtlan',
  'Ocotlan',
  'Ojuelos de Jalisco',
  'Pihuamo',
  'Poncitlan',
  'Puerto Vallarta',
  'Quitupan',
  'San Cristobal de la Barranca',
  'San Diego de Alejandria',
  'San Gabriel',
  'San Ignacio Cerro Gordo',
  'San Juan de los Lagos',
  'San Juanito de Escobedo',
  'San Julian',
  'San Marcos',
  'San Martin de Bolanos',
  'San Martin Hidalgo',
  'San Miguel el Alto',
  'San Pedro Tlaquepaque',
  'San Sebastian del Oeste',
  'Santa Maria de los Angeles',
  'Santa Maria del Oro',
  'Sayula',
  'Tala',
  'Talpa de Allende',
  'Tamazula de Gordiano',
  'Tapalpa',
  'Tecalitlan',
  'Techaluta de Montenegro',
  'Tecolotlan',
  'Tenamaxtlan',
  'Teocaltiche',
  'Teocuitatlan de Corona',
  'Tepatitlan de Morelos',
  'Tequila',
  'Teuchitlan',
  'Tizapan el Alto',
  'Tlajomulco de Zuniga',
  'Toliman',
  'Tomatlan',
  'Tonala',
  'Tonaya',
  'Tonila',
  'Totatiche',
  'Tototlan',
  'Tuxcacuesco',
  'Tuxcueca',
  'Tuxpan',
  'Union de San Antonio',
  'Union de Tula',
  'Valle de Guadalupe',
  'Valle de Juarez',
  'Villa Corona',
  'Villa Guerrero',
  'Villa Hidalgo',
  'Villa Purificacion',
  'Yahualica de Gonzalez Gallo',
  'Zacoalco de Torres',
  'Zapopan',
  'Zapotiltic',
  'Zapotitlan de Vadillo',
  'Zapotlan del Rey',
  'Zapotlan el Grande',
  'Zapotlanejo',
];

export const normalizeMunicipioText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

const municipioAliases = {
  tlaquepaque: 'San Pedro Tlaquepaque',
  tlajomulco: 'Tlajomulco de Zuniga',
  'ciudad guzman': 'Zapotlan el Grande',
  'zapotlan grande': 'Zapotlan el Grande',
};

const municipiosJaliscoByKey = municipiosJalisco.reduce((acc, currentMunicipio) => {
  acc[normalizeMunicipioText(currentMunicipio)] = currentMunicipio;
  return acc;
}, {});

export const getCanonicalMunicipioJalisco = (value) => {
  const rawMunicipio = String(value || '').trim();
  if (!rawMunicipio) return '';

  const normalizedMunicipio = normalizeMunicipioText(rawMunicipio);
  return (
    municipioAliases[normalizedMunicipio]
    || municipiosJaliscoByKey[normalizedMunicipio]
    || ''
  );
};

export const matchesMunicipioJalisco = (candidate, selected) => {
  if (!selected) return true;

  const candidateKey = normalizeMunicipioText(getCanonicalMunicipioJalisco(candidate) || candidate);
  const selectedKey = normalizeMunicipioText(getCanonicalMunicipioJalisco(selected) || selected);

  return candidateKey === selectedKey;
};
