/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState } from "react";
import { useSocket } from "../../../hooks/websocket";
import Image from "next/image";
import { getOldSigList } from "../../../apis/business";

interface MessageItem {
  id: string;
  src: string;
  x: number;
  y: number;
}

export default function Home() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [guestMessages, setGuestMessages] = useState<any[]>([]);

  // 生成随机位置，避免覆盖嘉宾消息区域
  const generateRandomPosition = () => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // 定义嘉宾消息区域（屏幕中央区域）
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;
    const guestAreaWidth = 400; // 嘉宾区域宽度
    const guestAreaHeight = 300; // 嘉宾区域高度

    let x, y;
    let attempts = 0;
    const maxAttempts = 50;

    do {
      x = Math.random() * (screenWidth - 100); // 减去图片宽度
      y = Math.random() * (screenHeight - 100); // 减去图片高度
      attempts++;
    } while (
      attempts < maxAttempts &&
      Math.abs(x - centerX) < guestAreaWidth / 2 &&
      Math.abs(y - centerY) < guestAreaHeight / 2
    );

    return { x, y };
  };

  // 处理接收到的消息
  const handleMessage = (data: any) => {
    console.log("Received in component:", data);
    const tData = JSON.parse(data.message);
    const position = generateRandomPosition();
    const newMessage: MessageItem = {
      id: Date.now().toString() + Math.random().toString(),
      src: tData?.file?.filepath,
      x: position.x,
      y: position.y,
    };
    setMessages((prev) => [...prev, newMessage]);
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
      const tData = res?.result?.map((item: any) => item.file.filepath);

      if (type === 1) {
        setGuestMessages((prev) => [...prev, ...tData]);
      } else {
        // 为历史消息也生成随机位置
        const messagesWithPositions = tData.map((filepath: string) => {
          const position = generateRandomPosition();
          return {
            id: Date.now().toString() + Math.random().toString(),
            src: filepath,
            x: position.x,
            y: position.y,
          };
        });
        setMessages((prev) => [...prev, ...messagesWithPositions]);
      }
    };
    getSigList(1, 5).then(() => {
      getSigList(0, 50);
    });
  }, []);

  return (
    <div className="sig-show-page">
      {/* 嘉宾消息 - 居中显示 */}
      <div className="guest-messages-container">
        {guestMessages.map((item, index) => (
          <div key={index} className="guest-message-item">
            <Image
              src={`https://hkpc-app-service-169749647729.asia-east2.run.app${item}`}
              alt="sig"
              width={100}
              height={100}
            />
          </div>
        ))}
      </div>

      {/* 普通消息 - 随机位置显示 */}
      <div className="messages-container">
        {messages.map((item) => (
          <div
            key={item.id}
            className="message-item"
            style={{
              left: `${item.x}px`,
              top: `${item.y}px`,
            }}
          >
            <Image
              src={`https://hkpc-app-service-169749647729.asia-east2.run.app${item.src}`}
              alt="sig"
              width={100}
              height={100}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
