import type { Locale } from '../i18n/catalog';
import type { Facility, ShelterKind } from '../features/shelters/model';
export interface RequestOptions {
  signal?: AbortSignal;
}
export interface PreferencesDto {
  language: unknown;
}
export type LocalizedText = string | Partial<Record<Locale, string>>;
export interface DistrictDto {
  id: string | number;
  name: LocalizedText;
}
export interface ShelterDto {
  id: string | number;
  name: LocalizedText;
  address: LocalizedText;
  district_id?: string | number;
  district?: LocalizedText | { id?: string | number; name: LocalizedText };
  type: string;
  access?: string;
  capacity?: number | LocalizedText | null;
  facilities?: string[];
  hours?: LocalizedText;
  example_walk?: LocalizedText;
  latitude: number | string;
  longitude: number | string;
}
export interface PlaceDto {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  kind: 'metro' | 'street' | 'address';
  latitude: number;
  longitude: number;
}
export interface FeedbackInput {
  comment: string;
  shelterId?: string;
  shelterName?: string;
}
export interface ShelterSuggestionInput {
  address: string;
  type: ShelterKind | null;
  facilities: Facility[];
  details: string;
}
export interface AppApi {
  getPreferences(options?: RequestOptions): Promise<PreferencesDto>;
  updateLanguage(
    language: Locale,
    options?: RequestOptions,
  ): Promise<PreferencesDto>;
  getDistricts(options?: RequestOptions): Promise<unknown[]>;
  getShelters(options?: RequestOptions): Promise<unknown[]>;
  searchPlaces(query: string, options?: RequestOptions): Promise<PlaceDto[]>;
  submitFeedback(input: FeedbackInput, options?: RequestOptions): Promise<void>;
  suggestShelter(
    input: ShelterSuggestionInput,
    options?: RequestOptions,
  ): Promise<void>;
}
