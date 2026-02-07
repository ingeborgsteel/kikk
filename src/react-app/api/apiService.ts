interface ICallApi {
  url: string;
}

export const callApi = async <T>({ url }: ICallApi): Promise<T> => {
  const response = await fetch(url);

  if (response.ok) {
    return response.json();
  }

  const errorData = await response.json();
  return Promise.reject(errorData);
};
