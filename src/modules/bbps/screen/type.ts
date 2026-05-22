export interface Biller {
  id: string;
  name: string;
  operator_id: number;
  logoUrl?: string;
}

export interface StateBillerSection {
  title: string;
  data: Biller[];
}

export interface OperatorAPIResponse {
  [state: string]: {
    operator_id: number;
    name: string;
  }[];
}

/**
 * Transform API response data into SectionList format
 * @param apiData Object with states as keys and biller arrays as values
 * @returns Formatted SectionList data
 */
export const transformOperatorsData = (apiData: OperatorAPIResponse): StateBillerSection[] => {
  return Object.keys(apiData)
    .sort() // Sort states alphabetically
    .map((state) => ({
      title: state,
      data: apiData[state].map((item: any) => ({
        id: item.operator_id.toString(),
        name: item.name,
        operator_id: item.operator_id,
      })),
    }));
};
