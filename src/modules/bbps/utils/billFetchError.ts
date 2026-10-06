// Read field names only; never display rejected values or the raw provider payload.
export const getBillFetchErrorMessage = (response: any): string => {
  const message = typeof response?.message === 'string'
    ? response.message
    : 'Unable to fetch bill details';
  const sources = [response, response?.data, response?.data?.data];
  const fields = new Set<string>();
  const addField = (name: unknown) => {
    if (typeof name === 'string' && /^[a-zA-Z_][a-zA-Z0-9_ .-]{0,79}$/.test(name)) {
      fields.add(name);
    }
  };
  for (const source of sources) {
    for (const details of [source?.invalid_params, source?.missing]) {
      if (Array.isArray(details)) {
        for (const item of details) {
          addField(typeof item === 'string' ? item : item?.param_name ?? item?.field ?? item?.name);
        }
      } else if (details && typeof details === 'object') {
        Object.keys(details).forEach(addField);
      } else {
        addField(details);
      }
    }
  }
  const reference = sources.map(source => source?.client_ref_id)
    .find(value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value));
  return [
    message,
    fields.size ? `Fields to check: ${Array.from(fields).join(', ')}` : '',
    reference ? `Reference: ${reference}` : '',
  ].filter(Boolean).join('\n');
};
