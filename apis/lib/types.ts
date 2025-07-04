// 基础请求类型
export interface BaseRequest {
  requestId?: string;
}

// 基础响应类型

interface ResponseData {
  Error?: {
    Code: string;
    Message: string;
  };
  Data?: {
    Token?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
export interface BaseResponse {
  Response: ResponseData;
  RequestId?: string;

  [key: string]: unknown;
}

// 错误类型
export interface ApiError {
  code: string;
  message: string;
}
// API响应状态码
export enum ApiStatusCode {
  SUCCESS = 0,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  SERVER_ERROR = 500,
}

// API错误消息
export const ApiErrorMessages = {
  [ApiStatusCode.UNAUTHORIZED]: 'Please login first',
  [ApiStatusCode.FORBIDDEN]: 'Permission denied',
  [ApiStatusCode.NOT_FOUND]: 'Resource not found',
  [ApiStatusCode.SERVER_ERROR]: 'Server error',
  NETWORK_ERROR: 'Network error',
  REQUEST_FAILED: 'Request failed',
  NO_RESPONSE: 'No response received',
  REQUEST_ERROR: 'Request configuration error',
} as const;
