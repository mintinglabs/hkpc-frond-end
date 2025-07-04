/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "../../../hooks/websocket";
import Image from "next/image";
import { getOldSigList } from "../../../apis/business";
import "animate.css";

const baseURL = "https://hkpc-app-service-169749647729.asia-east2.run.app";

type PositionedMessage = {
  url: string;
  x: number;
  y: number;
};

export default function Home() {
  const [messages, setMessages] = useState<PositionedMessage[]>([]);
  const [guestMessages, setGuestMessages] = useState<string[]>([]);

  const usedPositions = useRef<{ x: number; y: number }[]>([]);

  const IMAGE_SIZE = 100;
  const PADDING = 20;

  // 中心区域禁区，避开 guestMessages（假设它大约在屏幕中心，1000x419 区域）
  const centerExclusionZone = {
    x: window?.innerWidth / 2 - 500,
    y: window?.innerHeight / 2 - 209,
    width: 1000,
    height: 419,
  };

  const isOverlapping = (
    x: number,
    y: number,
    positions: { x: number; y: number }[]
  ) => {
    return positions.some(
      (pos) =>
        Math.abs(pos.x - x) < IMAGE_SIZE + PADDING &&
        Math.abs(pos.y - y) < IMAGE_SIZE + PADDING
    );
  };

  const isInsideCenterZone = (x: number, y: number) => {
    return (
      x + IMAGE_SIZE > centerExclusionZone.x &&
      x < centerExclusionZone.x + centerExclusionZone.width &&
      y + IMAGE_SIZE > centerExclusionZone.y &&
      y < centerExclusionZone.y + centerExclusionZone.height
    );
  };

  const generateRandomPosition = (): { x: number; y: number } => {
    const maxAttempts = 100;
    for (let i = 0; i < maxAttempts; i++) {
      const x = Math.floor(Math.random() * (window.innerWidth - IMAGE_SIZE));
      const y = Math.floor(Math.random() * (window.innerHeight - IMAGE_SIZE));

      if (
        !isInsideCenterZone(x, y) &&
        !isOverlapping(x, y, usedPositions.current)
      ) {
        usedPositions.current.push({ x, y });
        return { x, y };
      }
    }

    // fallback
    return { x: 0, y: 0 };
  };

  const handleMessage = (data: any) => {
    const tData = JSON.parse(data.message);
    const imgURL = `${baseURL}${tData?.file?.filepath}`;
    console.log(tData);
    const { x, y } = generateRandomPosition();

    if (tData.idata.type) {
      setGuestMessages((prev) => [...prev, imgURL]);
    } else {
      setMessages((prev) => [
        ...prev,
        { url: `${imgURL}&t=${Date.now()}`, x, y },
      ]);
    }
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
        const newMessages: PositionedMessage[] = tData.map((url: string) => {
          const { x, y } = generateRandomPosition();
          return { url: `${url}&t=${Date.now()}`, x, y };
        });
        setMessages((prev) => [...prev, ...newMessages]);
      }
    };

    getSigList(1, 5).then(() => getSigList(0, 50));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full h-screen relative overflow-hidden bg-black">
      {/* guestMessages 居中 */}
      <div className="w-[1000px] h-[419px] border-[1px] border-[#EB5757] absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] flex justify-center items-center gap-4 z-10">
        {guestMessages.map((item, index) => (
          <Image
            key={index}
            src={`${item}&t=${Date.now()}`}
            alt="guest"
            width={IMAGE_SIZE}
            height={IMAGE_SIZE}
            className="animate__animated animate__pulse animate__infinite"
          />
        ))}
      </div>

      {/* messages 随机分布 */}
      {messages.map((item, index) => (
        <Image
          key={index}
          src={item.url}
          alt="sig"
          width={IMAGE_SIZE}
          height={IMAGE_SIZE}
          className="absolute animate__animated animate__pulse animate__infinite"
          style={{
            top: item.y,
            left: item.x,
          }}
        />
      ))}
    </div>
  );
}
