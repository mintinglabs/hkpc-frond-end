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

  // 生成随机位置，避免覆盖嘉宾消息区域和其他图片
  const generateRandomPosition = (existingMessages: MessageItem[] = []) => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // 定义嘉宾消息区域（屏幕中央区域）
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;
    const guestAreaWidth = 400; // 嘉宾区域宽度
    const guestAreaHeight = 300; // 嘉宾区域高度

    // 图片尺寸
    const imgWidth = 150;
    const imgHeight = 150;

    // 安全边距
    const margin = 20;

    let x: number, y: number;
    let attempts = 0;
    const maxAttempts = 200;

    do {
      x = Math.random() * (screenWidth - imgWidth);
      y = Math.random() * (screenHeight - imgHeight);
      attempts++;

      // 检查是否在嘉宾区域内
      const inGuestArea =
        Math.abs(x + imgWidth / 2 - centerX) < guestAreaWidth / 2 &&
        Math.abs(y + imgHeight / 2 - centerY) < guestAreaHeight / 2;

      if (inGuestArea) {
        continue; // 如果在嘉宾区域内，重新生成位置
      }

      // 检查是否与现有图片重叠
      const overlapsWithExisting = existingMessages.some((existingMsg) => {
        // 检查两个矩形是否重叠
        const rect1 = {
          left: x,
          right: x + imgWidth,
          top: y,
          bottom: y + imgHeight,
        };

        const rect2 = {
          left: existingMsg.x,
          right: existingMsg.x + imgWidth,
          top: existingMsg.y,
          bottom: existingMsg.y + imgHeight,
        };

        // 如果两个矩形不重叠，则 rect1 在 rect2 的左边、右边、上边或下边
        const notOverlapping =
          rect1.right + margin < rect2.left ||
          rect1.left > rect2.right + margin ||
          rect1.bottom + margin < rect2.top ||
          rect1.top > rect2.bottom + margin;

        return !notOverlapping; // 如果重叠，返回 true
      });

      if (!overlapsWithExisting) {
        break; // 找到合适的位置
      }
    } while (attempts < maxAttempts);

    // 如果尝试次数过多，返回一个边缘位置
    if (attempts >= maxAttempts) {
      const edgePositions = [
        { x: 50, y: 50 },
        { x: screenWidth - imgWidth - 50, y: 50 },
        { x: 50, y: screenHeight - imgHeight - 50 },
        { x: screenWidth - imgWidth - 50, y: screenHeight - imgHeight - 50 },
        { x: screenWidth / 2 - imgWidth / 2, y: 50 },
        { x: screenWidth / 2 - imgWidth / 2, y: screenHeight - imgHeight - 50 },
        { x: 50, y: screenHeight / 2 - imgHeight / 2 },
        { x: screenWidth - imgWidth - 50, y: screenHeight / 2 - imgHeight / 2 },
      ];

      // 找到一个不与现有图片重叠的边缘位置
      for (const pos of edgePositions) {
        const overlapsWithExisting = existingMessages.some((existingMsg) => {
          const rect1 = {
            left: pos.x,
            right: pos.x + imgWidth,
            top: pos.y,
            bottom: pos.y + imgHeight,
          };

          const rect2 = {
            left: existingMsg.x,
            right: existingMsg.x + imgWidth,
            top: existingMsg.y,
            bottom: existingMsg.y + imgHeight,
          };

          const notOverlapping =
            rect1.right + margin < rect2.left ||
            rect1.left > rect2.right + margin ||
            rect1.bottom + margin < rect2.top ||
            rect1.top > rect2.bottom + margin;

          return !notOverlapping;
        });

        if (!overlapsWithExisting) {
          return pos;
        }
      }

      // 如果所有边缘位置都被占用，返回一个随机位置
      return {
        x: Math.random() * (screenWidth - imgWidth),
        y: Math.random() * (screenHeight - imgHeight),
      } as { x: number; y: number };
    }

    return { x, y };
  };

  // 处理接收到的消息
  const handleMessage = (data: any) => {
    console.log("Received in component:", data);
    const tData = JSON.parse(data.message);
    const position = generateRandomPosition(messages);
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
        // 为历史消息也生成随机位置，考虑已存在的消息
        const messagesWithPositions: MessageItem[] = [];
        const currentMessages = [...messages]; // 当前已有的消息

        for (const filepath of tData) {
          const position = generateRandomPosition(currentMessages);
          const newMessage: MessageItem = {
            id: Date.now().toString() + Math.random().toString(),
            src: filepath,
            x: position.x,
            y: position.y,
          };
          messagesWithPositions.push(newMessage);
          currentMessages.push(newMessage); // 更新当前消息列表，供下一个消息参考
        }

        setMessages((prev) => [...prev, ...messagesWithPositions]);
      }
    };
    getSigList(1, 5).then(() => {
      getSigList(0, 50);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              width={150}
              height={150}
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
