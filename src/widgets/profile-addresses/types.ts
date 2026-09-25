export interface Address {
  id: string;
  city: string; // по умолчанию "г. Кизляр"
  street: string;
  house: string;
  apartment?: string | undefined;
  entrance?: string | undefined;
  floor?: string | undefined;
  intercom?: string | undefined;
  comment?: string | undefined;
  isDefault: boolean;
}
