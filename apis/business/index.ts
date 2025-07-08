import { request } from "../lib/base";

interface UploadPortraitRequest {
  file: File;
}

// 上传相片
export const uploadSigFile = (
  data: UploadPortraitRequest,
  type: 1 | 0,
  name: string,
  guestId?: number
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formData: any = new FormData();
  formData.append("file", data.file, name);
  formData.append("name", name);
  formData.append("type", type.toString());
  if (guestId !== undefined) {
    formData.append("extraData", guestId.toString());
  }

  return request.post("/hkpc-api/v1/idata/upload-signature", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getSigList = (query: { limit: number; vipLimit: number }) => {
  return request.get("/hkpc-api/v1/idata/multi-list", {
    params: query,
  });
};
