import type { Coordinates } from '../../geo';

// Fictional demo positions only. Replace this mapping in the API adapter later.
// These points do not certify shelter locations or match the example addresses.
export const demoShelterCoordinates: Record<string, Coordinates> = {
  'metro-zhytomyrska': { latitude: 50.4551, longitude: 30.3657 },
  'basement-111': { latitude: 50.4518, longitude: 30.3732 },
  'lvivska-23': { latitude: 50.4583, longitude: 30.3694 },
  'metro-sviatoshyn': { latitude: 50.4575, longitude: 30.3901 },
  'basement-144': { latitude: 50.4549, longitude: 30.3868 },
  'school-51': { latitude: 50.4492, longitude: 30.3718 },
  parking: { latitude: 50.4542, longitude: 30.3635 },
  underpass: { latitude: 50.4557, longitude: 30.3678 },
};
export const demoSearchCoordinates: Record<string, Coordinates> = {
  zhytomyrska: demoShelterCoordinates['metro-zhytomyrska'],
  'velyka-zhytomyrska': { latitude: 50.4547, longitude: 30.5165 },
  'mala-zhytomyrska': { latitude: 50.4526, longitude: 30.5214 },
  'velyka-8': { latitude: 50.455, longitude: 30.516 },
  'velyka-20': { latitude: 50.4564, longitude: 30.5122 },
};
export const demoMapCenter: Coordinates = {
  latitude: 50.4547,
  longitude: 30.375,
};
export const demoUserCoordinates: Coordinates = {
  latitude: 50.4538,
  longitude: 30.3705,
};

export const demoSearchRadiusMeters = 2000;
