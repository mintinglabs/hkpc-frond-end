import { request } from "../lib/base";

interface UploadPortraitRequest {
  file: File;
}

// 上传相片
export const uploadSigFile = (
  data: UploadPortraitRequest,
  type: 1 | 0,
  name: string
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formData: any = new FormData();
  formData.append("file", data.file, "ab.png");
  formData.append("name", name);
  formData.append("type", type.toString());

  return request.post("/hkpc-api/v1/idata/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getOldSigList = (query: { type: 1 | 0; limit: number }) => {
  return request.get("/hkpc-api/v1/idata/list", {
    params: query,
  });
};
