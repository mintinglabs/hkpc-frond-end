/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "../../../hooks/websocket";
import { getOldSigList } from "../../../apis/business";
import "animate.css";

const baseURL = "https://hkpc-app-service-169749647729.asia-east2.run.app";

type PositionedMessage = {
  url: string;
  x: number;
  y: number;
  id: string;
  hasAnimation: boolean;
};

export default function Home() {
  const [messages, setMessages] = useState<PositionedMessage[]>([]);
  const [guestMessages, setGuestMessages] = useState<string[]>([]);
  const [initialAnimationActive, setInitialAnimationActive] = useState(true);
  const [animatedMessageIds, setAnimatedMessageIds] = useState<Set<string>>(
    new Set()
  );

  const usedPositions = useRef<{ x: number; y: number }[]>([]);
  const animationTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const IMAGE_SIZE = 100;
  const PADDING = 20;
  const ANIMATION_DURATION = 10000; // 10秒

  // 中心区域禁区，避开 guestMessages（假设它大约在屏幕中心，1000x419 区域）
  const centerExclusionZone = useRef({
    x: 0,
    y: 0,
    width: 1000,
    height: 419,
  });
  useEffect(() => {
    centerExclusionZone.current = {
      x: window.innerWidth / 2 - 500,
      y: window.innerHeight / 2 - 209,
      width: 1000,
      height: 419,
    };
  }, []);

  // 初始化动画定时器
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialAnimationActive(false);
    }, ANIMATION_DURATION);

    return () => clearTimeout(timer);
  }, []);

  // 清理动画定时器
  useEffect(() => {
    return () => {
      animationTimers.current.forEach((timer) => clearTimeout(timer));
      animationTimers.current.clear();
    };
  }, []);

  // 添加消息动画
  const addMessageAnimation = (messageId: string) => {
    setAnimatedMessageIds((prev) => new Set(prev).add(messageId));

    // 设置10秒后停止动画
    const timer = setTimeout(() => {
      setAnimatedMessageIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
      animationTimers.current.delete(messageId);
    }, ANIMATION_DURATION);

    animationTimers.current.set(messageId, timer);
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
      x + IMAGE_SIZE > centerExclusionZone.current.x &&
      x < centerExclusionZone.current.x + centerExclusionZone.current.width &&
      y + IMAGE_SIZE > centerExclusionZone.current.y &&
      y < centerExclusionZone.current.y + centerExclusionZone.current.height
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
      const messageId = Date.now().toString() + Math.random().toString();
      const newMessage: PositionedMessage = {
        url: `${imgURL}&t=${Date.now()}`,
        x,
        y,
        id: messageId,
        hasAnimation: true,
      };

      setMessages((prev) => [...prev, newMessage]);
      addMessageAnimation(messageId);
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
          const messageId = Date.now().toString() + Math.random().toString();
          return {
            url: `${url}&t=${Date.now()}`,
            x,
            y,
            id: messageId,
            hasAnimation: false, // 历史消息不添加动画
          };
        });
        setMessages((prev) => [...prev, ...newMessages]);
      }
    };

    getSigList(1, 5).then(() => getSigList(0, 50));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full h-screen relative overflow-hidden bg-[url('/sig-show_bg.png')] bg-cover bg-center">
      {/* guestMessages 居中 */}
      <div className="w-[1000px] h-[419px] absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] flex justify-center items-center gap-4 z-10">
        {guestMessages.map((item, index) => (
          <img
            key={index}
            src={`${item}&t=${Date.now()}`}
            alt="guest"
            width={IMAGE_SIZE}
            height={IMAGE_SIZE}
            className={`${
              initialAnimationActive
                ? "animate__animated animate__pulse animate__infinite"
                : ""
            } guest-message-${index}`}
          />
        ))}
      </div>

      {/* messages 随机分布 */}
      {messages.map((item) => (
        <img
          key={item.id}
          src={item.url}
          alt="sig"
          width={IMAGE_SIZE}
          height={IMAGE_SIZE}
          className={`absolute ${
            initialAnimationActive || animatedMessageIds.has(item.id)
              ? "animate__animated animate__pulse animate__infinite"
              : ""
          }`}
          style={{
            top: item.y,
            left: item.x,
          }}
        />
      ))}
    </div>
  );
}
