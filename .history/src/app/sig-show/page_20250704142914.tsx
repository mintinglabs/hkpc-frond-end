/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "../../../hooks/websocket";
import Image from "next/image";
import { getOldSigList } from "../../../apis/business";
import "animate.css";

const baseURL = "https://hkpc-app-service-169749647729.asia-east2.run.app";

const IMAGE_SIZE = 100;
const PADDING = 20;

type PositionedMessage = {
  url: string;
  x: number;
  y: number;
};

export default function Home() {
  const [messages, setMessages] = useState<PositionedMessage[]>([]);
  const [guestMessages, setGuestMessages] = useState<string[]>([]);
  const [animatedKeys, setAnimatedKeys] = useState<Set<number>>(new Set());

  const usedPositions = useRef<{ x: number; y: number }[]>([]);

  // 计算中心禁区，避开 guestMessages 区域
  const getCenterExclusionZone = () => {
    const centerWidth = 1000;
    const centerHeight = 419;
    const x = window.innerWidth / 2 - centerWidth / 2;
    const y = window.innerHeight / 2 - centerHeight / 2;

    return {
      x,
      y,
      width: centerWidth,
      height: centerHeight,
    };
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
    const zone = getCenterExclusionZone();
    return (
      x + IMAGE_SIZE > zone.x &&
      x < zone.x + zone.width &&
      y + IMAGE_SIZE > zone.y &&
      y < zone.y + zone.height
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
    const key = Date.now();
    const imgURL = `${baseURL}${tData?.file?.filepath}&t=${key}`;
    const { x, y } = generateRandomPosition();

    // 添加 message
    setMessages((prev) => [...prev, { url: imgURL, x, y }]);

    // 添加动画 key
    setAnimatedKeys((prev) => {
      const updated = new Set(prev);
      updated.add(key);
      return updated;
    });

    // 10秒后移除动画 key
    setTimeout(() => {
      setAnimatedKeys((prev) => {
        const updated = new Set(prev);
        updated.delete(key);
        return updated;
      });
    }, 10000);
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
          const key = Date.now() + Math.floor(Math.random() * 100000); // 避免重复
          const { x, y } = generateRandomPosition();
          setAnimatedKeys((prev) => {
            const updated = new Set(prev);
            updated.add(key);
            return updated;
          });
          setTimeout(() => {
            setAnimatedKeys((prev) => {
              const updated = new Set(prev);
              updated.delete(key);
              return updated;
            });
          }, 10000);
          return { url: `${url}&t=${key}`, x, y };
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
      <div className="w-[1000px] h-[419px] absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] flex justify-center items-center gap-4 z-10">
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
      {messages.map((item, index) => {
        const key = parseInt(item.url.split("t=")[1], 10);
        const isAnimating = animatedKeys.has(key);

        return (
          <Image
            key={index}
            src={item.url}
            alt="sig"
            width={IMAGE_SIZE}
            height={IMAGE_SIZE}
            className={`absolute ${
              isAnimating ? "animate__animated animate__pulse" : ""
            }`}
            style={{
              top: item.y,
              left: item.x,
            }}
          />
        );
      })}
    </div>
  );
}
