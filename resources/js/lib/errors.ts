export interface ErrorRequestInfo {
  url?: string;
  method?: string;
  payload?: string;
}

export interface ErrorContext {
  details: string;
  requestInfo?: ErrorRequestInfo;
}

export const getErrorContext = (error: unknown): ErrorContext => {
  if (!error) {
    return { details: "" };
  }

  const requestInfo = (error as any)?.requestInfo as
    | ErrorRequestInfo
    | undefined;
  const maybeResponse = (error as any)?.response;

  const serialize = (value: any): string => {
    if (value == null) {
      return "";
    }
    if (typeof value === "string") {
      return value;
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  if (maybeResponse?.data !== undefined && maybeResponse?.data !== null) {
    return {
      details: serialize(maybeResponse.data),
      requestInfo,
    };
  }

  if (typeof error === "string") {
    return {
      details: error,
      requestInfo,
    };
  }

  if (error instanceof Error) {
    return {
      details: error.stack || error.message || "",
      requestInfo,
    };
  }

  return {
    details: serialize(error),
    requestInfo,
  };
};
