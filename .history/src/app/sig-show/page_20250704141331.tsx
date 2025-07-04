"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "../../../hooks/websocket";
import Image from "next/image";
import { getOldSigList } from "../../../apis/business";

const baseURL = "https://hkpc-app-service-169749647729.asia-east2.run.app";

type PositionedMessage = {
  url: string;
  x: number;
  y: number;
};

export default function Home() {
  const [messages, setMessages] = useState<PositionedMessage[]>([]);
  const [guestMessages, setGuestMessages] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // 用于生成随机但避免重叠的位置
  const usedPositions = useRef<{ x: number; y: number }[]>([]);

  const generateRandomPosition = (
    width: number,
    height: number
  ): { x: number; y: number } => {
    const maxAttempts = 100;
    const padding = 20;

    for (let i = 0; i < maxAttempts; i++) {
      const x = Math.floor(
        Math.random() * (window.innerWidth - width - padding)
      );
      const y = Math.floor(
        Math.random() * (window.innerHeight - height - padding)
      );

      const overlapping = usedPositions.current.some(
        (pos) =>
          Math.abs(pos.x - x) < width + padding &&
          Math.abs(pos.y - y) < height + padding
      );

      if (!overlapping) {
        usedPositions.current.push({ x, y });
        return { x, y };
      }
    }

    // fallback: just return a random position
    return {
      x: Math.floor(Math.random() * (window.innerWidth - width)),
      y: Math.floor(Math.random() * (window.innerHeight - height)),
    };
  };

  const handleMessage = (data: any) => {
    const tData = JSON.parse(data.message);
    const imgURL = `${baseURL}${tData?.file?.filepath}`;

    const { x, y } = generateRandomPosition(100, 100); // 100x100 为图片尺寸
    setMessages((prev) => [
      ...prev,
      { url: `${imgURL}&t=${Date.now()}`, x, y },
    ]);
  };

  useSocket(
    "wss://hkpc-app-service-169749647729.asia-east2.run.app/",
    handleMessage
  );

  useEffect(() => {
    const getSigList = async (type: 0 | 1, limit: number) => {
      const res: any = await getOldSigList({ type, limit });

      const tData = res?.result?.map(
        (item: any) => `${baseURL}${item.file.filepath}`
      );

      if (type === 1) {
        setGuestMessages((prev) => [...prev, ...tData]);
      } else {
        const newMessages: PositionedMessage[] = tData.map((url) => {
          const { x, y } = generateRandomPosition(100, 100);
          return { url: `${url}&t=${Date.now()}`, x, y };
        });
        setMessages((prev) => [...prev, ...newMessages]);
      }
    };

    getSigList(1, 5).then(() => {
      getSigList(0, 50);
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-screen relative overflow-hidden bg-black"
    >
      {/* guestMessages 居中显示 */}
      <div className="absolute inset-0 flex justify-center items-center gap-4 z-10">
        {guestMessages.map((item, index) => (
          <Image
            key={index}
            src={`${item}&t=${Date.now()}`}
            alt="guest"
            width={100}
            height={100}
          />
        ))}
      </div>

      {/* messages 随机散布 */}
      {messages.map((item, index) => (
        <Image
          key={index}
          src={item.url}
          alt="sig"
          width={100}
          height={100}
          className="absolute"
          style={{
            top: item.y,
            left: item.x,
          }}
        />
      ))}
    </div>
  );
}
