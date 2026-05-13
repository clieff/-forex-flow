export type CurrencyDto = {
  code: string;
  name: string;
  flagCode: string;
  buyRate: number;
  sellRate: number;
  updatedAt: Date;
};

export type ClientRateDto = {
  id: string;
  clientId: string;
  currencyCode: string;
  buyRate: number | null;
  sellRate: number | null;
};

export type ClientDto = {
  id: string;
  name: string;
  contact: string | null;
  fixedRates: ClientRateDto[];
  createdAt: Date;
};
