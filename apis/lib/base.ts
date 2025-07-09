/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { ApiStatusCode, ApiErrorMessages } from "./types";
import type { BaseResponse } from "./types";

// 请求数据的类型
type RequestData = Record<string, unknown> | unknown[] | null;

// 创建axios实例
const createAxiosInstance = (config?: AxiosRequestConfig): AxiosInstance => {
  const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "/",
    timeout: 3000,
    headers: {
      "Content-Type": "application/json",
    },
    ...config,
  });

  // 请求拦截器
  instance.interceptors.request.use(
    (config: any) => {
      return config;
    },
    (error: any) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response: AxiosResponse<BaseResponse>) => {
      // 修改返回值为完整的 response 对象，但更新其 data 属性
      return response;
    },
    (error: AxiosError<BaseResponse>) => {
      if (error.response) {
        const { status } = error.response;

        // 处理特定的HTTP状态码
        switch (status) {
          case ApiStatusCode.UNAUTHORIZED:
            console.error(ApiErrorMessages[ApiStatusCode.UNAUTHORIZED]);
            break;
          case ApiStatusCode.FORBIDDEN:
            console.error(ApiErrorMessages[ApiStatusCode.FORBIDDEN]);
            break;
          case ApiStatusCode.SERVER_ERROR:
            console.error(ApiErrorMessages[ApiStatusCode.SERVER_ERROR]);
            break;
          default:
            console.error(ApiErrorMessages.NETWORK_ERROR);
        }
      } else if (error.request) {
        throw new Error(ApiErrorMessages.REQUEST_ERROR);
      } else {
        throw new Error(ApiErrorMessages.REQUEST_ERROR);
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// 创建默认的axios实例
const http = createAxiosInstance();

// 封装基础的请求方法
export const request = {
  get: (url: string, config?: AxiosRequestConfig) => {
    return http.get<BaseResponse>(url, config).then((res) => res.data);
  },

  post: (url: string, data?: RequestData, config?: AxiosRequestConfig) => {
    return http
      .post<unknown, BaseResponse>(url, data, config)
      .then((res) => res.data);
  },

  put: (url: string, data?: RequestData, config?: AxiosRequestConfig) => {
    return http
      .put<unknown, BaseResponse>(url, data, config)
      .then((res) => res.data);
  },

  delete: (url: string, config?: AxiosRequestConfig) => {
    return http
      .delete<unknown, BaseResponse>(url, config)
      .then((res) => res.data);
  },
};

// 导出类型
export type { RequestData };

// 导出实例创建方法，以便需要创建新实例时使用
export { createAxiosInstance };
