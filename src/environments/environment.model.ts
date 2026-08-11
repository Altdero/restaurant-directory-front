export type DataLayerImplementation = 'http-resource' | 'tanstack';

export interface Environment {
  readonly production: boolean;
  readonly apiBaseUrl: string;
  readonly dataLayer: DataLayerImplementation;
}
