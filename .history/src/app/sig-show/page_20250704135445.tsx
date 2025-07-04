/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState } from "react";
import { useSocket } from "../../../hooks/websocket";
import { getOldSigList } from "../../../apis/business";

const baseURL = "https://hkpc-app-service-169749647729.asia-east2.run.app";

export default function Home() {
  const [messages, setMessages] = useState<any[]>([]);

  // 处理接收到的消息
  const handleMessage = (data: any) => {
    console.log("Received in component:", data);
    const tData = JSON.parse(data.message);
    setMessages((prev) => [...prev, `${baseURL}${tData?.file?.filepath}`]);
  };

  // 连接 socket
  useSocket(
    "wss://hkpc-app-service-169749647729.asia-east2.run.app/",
    handleMessage
  );

  useEffect(() => {
    const getSigList = async (type: 0 | 1, limit: number) => {
      const res: any = await getOldSigList({
        type,
        limit,
      });
      // 提取出res?.result?.data中的filepath
      const tData = res?.result?.map(
        (item: any) => `${baseURL}${item.file.filepath}`
      );

      setMessages((prev) => [...prev, ...tData]);
    };
    getSigList(1, 5).then(() => {
      getSigList(0, 50);
    });
  }, []);

  return (
    <div className="text-white text-center text-[32px] font-[500]">
      {/* <Image
        src="/sig-show-bg.png"
        alt="sig"
        width={3840}
        height={3360}
        style={{ width: "100%", height: "100%" }}
      /> */}
      {/* 显示消息和连接状态 */}
      <div className="flex flex-wrap gap-4">
        {messages.map((item, index) => (
          <div key={index}>
            <img src={item} alt="sig" width={100} height={100} />
          </div>
        ))}
      </div>
    </div>
  );
}
