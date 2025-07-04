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
    const guestAreaWidth = 500; // 增加嘉宾区域宽度
    const guestAreaHeight = 400; // 增加嘉宾区域高度

    // 图片尺寸
    const imgWidth = 100;
    const imgHeight = 100;

    // 增加安全边距
    const margin = 50;

    let x: number, y: number;
    let attempts = 0;
    const maxAttempts = 500; // 增加最大尝试次数

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
        // 计算两个图片中心点的距离
        const center1 = { x: x + imgWidth / 2, y: y + imgHeight / 2 };
        const center2 = {
          x: existingMsg.x + imgWidth / 2,
          y: existingMsg.y + imgHeight / 2,
        };

        const distanceX = Math.abs(center1.x - center2.x);
        const distanceY = Math.abs(center1.y - center2.y);

        // 如果中心点距离小于图片尺寸+边距，则认为重叠
        const minDistanceX = imgWidth + margin;
        const minDistanceY = imgHeight + margin;

        return distanceX < minDistanceX && distanceY < minDistanceY;
      });

      if (!overlapsWithExisting) {
        break; // 找到合适的位置
      }
    } while (attempts < maxAttempts);

    // 如果尝试次数过多，使用网格布局
    if (attempts >= maxAttempts) {
      const gridSize = imgWidth + margin;
      const cols = Math.floor(screenWidth / gridSize);
      const rows = Math.floor(screenHeight / gridSize);

      // 生成所有可能的网格位置
      const gridPositions: { x: number; y: number }[] = [];

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const gridX = col * gridSize + margin / 2;
          const gridY = row * gridSize + margin / 2;

          // 检查是否在嘉宾区域内
          const inGuestArea =
            Math.abs(gridX + imgWidth / 2 - centerX) < guestAreaWidth / 2 &&
            Math.abs(gridY + imgHeight / 2 - centerY) < guestAreaHeight / 2;

          if (!inGuestArea) {
            gridPositions.push({ x: gridX, y: gridY });
          }
        }
      }

      // 随机打乱网格位置
      for (let i = gridPositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gridPositions[i], gridPositions[j]] = [
          gridPositions[j],
          gridPositions[i],
        ];
      }

      // 找到第一个不与现有图片重叠的位置
      for (const pos of gridPositions) {
        const overlapsWithExisting = existingMessages.some((existingMsg) => {
          const center1 = { x: pos.x + imgWidth / 2, y: pos.y + imgHeight / 2 };
          const center2 = {
            x: existingMsg.x + imgWidth / 2,
            y: existingMsg.y + imgHeight / 2,
          };

          const distanceX = Math.abs(center1.x - center2.x);
          const distanceY = Math.abs(center1.y - center2.y);

          const minDistanceX = imgWidth + margin;
          const minDistanceY = imgHeight + margin;

          return distanceX < minDistanceX && distanceY < minDistanceY;
        });

        if (!overlapsWithExisting) {
          return pos;
        }
      }

      // 如果网格位置都被占用，返回一个边缘位置
      const edgePositions = [
        { x: margin, y: margin },
        { x: screenWidth - imgWidth - margin, y: margin },
        { x: margin, y: screenHeight - imgHeight - margin },
        {
          x: screenWidth - imgWidth - margin,
          y: screenHeight - imgHeight - margin,
        },
      ];

      for (const pos of edgePositions) {
        const overlapsWithExisting = existingMessages.some((existingMsg) => {
          const center1 = { x: pos.x + imgWidth / 2, y: pos.y + imgHeight / 2 };
          const center2 = {
            x: existingMsg.x + imgWidth / 2,
            y: existingMsg.y + imgHeight / 2,
          };

          const distanceX = Math.abs(center1.x - center2.x);
          const distanceY = Math.abs(center1.y - center2.y);

          const minDistanceX = imgWidth + margin;
          const minDistanceY = imgHeight + margin;

          return distanceX < minDistanceX && distanceY < minDistanceY;
        });

        if (!overlapsWithExisting) {
          return pos;
        }
      }

      // 最后的兜底方案
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

      if (type === 1) {
        // 嘉宾消息不需要位置信息
        const tData = res?.result?.map((item: any) => item.file.filepath);
        setGuestMessages((prev) => [...prev, ...tData]);
      } else {
        // 普通消息：使用已存储的位置或生成新位置
        // const messagesWithPositions: MessageItem[] = [];
        // const currentMessages = [...messages]; // 当前已有的消息

        // for (const item of res?.result || []) {
        //   const filepath = item.file.filepath;
        //   let x: number, y: number;

        //   // 如果API返回的数据中已经包含位置信息，直接使用
        //   if (item.x !== undefined && item.y !== undefined) {
        //     x = item.x;
        //     y = item.y;
        //   } else {
        //     // 否则生成新的随机位置
        //     const position = generateRandomPosition(currentMessages);
        //     x = position.x;
        //     y = position.y;
        //   }

        //   const newMessage: MessageItem = {
        //     id: Date.now().toString() + Math.random().toString(),
        //     src: filepath,
        //     x: x,
        //     y: y,
        //   };

        //   messagesWithPositions.push(newMessage);
        //   currentMessages.push(newMessage); // 更新当前消息列表，供下一个消息参考
        // }
        const tData = res?.result?.map((item: any) => item.file.filepath);

        setMessages((prev) => [...prev, ...tData]);
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
          <div
            key={index}
            style={{
              transform:
                index % 2 === 0 ? "translateY(-50%)" : "translateY(-30%)",
            }}
            className={`guest-message-item guest-message-item-${index}`}
          >
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
            key={item}
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
