/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useRef, useState } from "react";

import { getSigList } from "../../../apis/business";
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
  const [guestMessages, setGuestMessages] = useState<(string | null)[]>([]);
  const [initialAnimationActive, setInitialAnimationActive] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [animatedMessageIds, setAnimatedMessageIds] = useState<Set<string>>(
    new Set()
  );

  const animationTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const PADDING = 20;
  const ANIMATION_DURATION = 10000; // 10秒

  // 中心区域禁区，避开 guestMessages（假设它大约在屏幕中心，1000x419 区域）
  const centerExclusionZone = useRef({
    x: 0,
    y: 0,
    width: 1200,
    height: 519,
  });
  useEffect(() => {
    centerExclusionZone.current = {
      x: window.innerWidth / 2 - 500,
      y: window.innerHeight / 2 - 209,
      width: 1200,
      height: 519,
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

  const isOverlapping = (
    x: number,
    y: number,
    positions: { x: number; y: number }[]
  ) => {
    const imageWidth = 198; // 2倍宽度
    const imageHeight = 282; // 2倍高度
    return positions.some(
      (pos) =>
        Math.abs(pos.x - x) < imageWidth + PADDING &&
        Math.abs(pos.y - y) < imageHeight + PADDING
    );
  };

  const isInsideCenterZone = (x: number, y: number) => {
    const imageWidth = 198; // 2倍宽度
    const imageHeight = 282; // 2倍高度
    return (
      x + imageWidth > centerExclusionZone.current.x &&
      x < centerExclusionZone.current.x + centerExclusionZone.current.width &&
      y + imageHeight > centerExclusionZone.current.y &&
      y < centerExclusionZone.current.y + centerExclusionZone.current.height
    );
  };

  const generateRandomPosition = (
    currentMessages: PositionedMessage[]
  ): { x: number; y: number } => {
    // 获取当前所有消息的位置，用于重叠检查
    const currentPositions = currentMessages.map((msg) => ({
      x: msg.x,
      y: msg.y,
    }));

    const imageWidth = 198; // 2倍宽度
    const imageHeight = 282; // 2倍高度
    const maxAttempts = 300; // 增加尝试次数
    for (let i = 0; i < maxAttempts; i++) {
      const x = Math.floor(Math.random() * (window.innerWidth - imageWidth));
      const y = Math.floor(Math.random() * (window.innerHeight - imageHeight));

      if (
        !isInsideCenterZone(x, y) &&
        !isOverlapping(x, y, currentPositions) // 只检查与当前显示消息的重叠
      ) {
        return { x, y };
      }
    }

    // 如果还是找不到，尝试在屏幕边缘区域放置
    const edgeZones = [
      { x: 0, y: 0, width: 400, height: window.innerHeight }, // 左边，增加宽度适应更大的图片
      {
        x: window.innerWidth - 400,
        y: 0,
        width: 400,
        height: window.innerHeight,
      }, // 右边，增加宽度适应更大的图片
      { x: 0, y: 0, width: window.innerWidth, height: 400 }, // 上边，增加高度适应更大的图片
      {
        x: 0,
        y: window.innerHeight - 400,
        width: window.innerWidth,
        height: 400,
      }, // 下边，增加高度适应更大的图片
    ];

    for (const zone of edgeZones) {
      for (let i = 0; i < 50; i++) {
        const x =
          zone.x + Math.floor(Math.random() * (zone.width - imageWidth));
        const y =
          zone.y + Math.floor(Math.random() * (zone.height - imageHeight));

        if (!isOverlapping(x, y, currentPositions)) {
          return { x, y };
        }
      }
    }

    // 最后的fallback：返回一个随机位置，即使可能重叠
    const x = Math.floor(Math.random() * (window.innerWidth - imageWidth));
    const y = Math.floor(Math.random() * (window.innerHeight - imageHeight));

    // 确保不在中心区域
    if (!isInsideCenterZone(x, y)) {
      return { x, y };
    }

    // 如果随机位置在中心区域，找一个边缘位置
    return { x: 200, y: 200 };
  };

  useEffect(() => {
    setSigList(50, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSigList = async (limit: number, vipLimit: number) => {
    try {
      const res: any = await getSigList({ limit, vipLimit });

      // 获取新的list数据
      const newList = res.result.list.map(
        (item: any) => `${baseURL}${item.file.filepath}`
      );

      // 获取新的vipList数据，包含位置信息
      const newVipList = res.result.vipList.map((item: any) => {
        if (item.extraData) {
          return {
            url: `${baseURL}${item.file.filepath}`,
            position: Number(item.extraData), // extraData 就是位置数字
          };
        }
        return null;
      });

      // 去重并排序：根据位置信息排序数组
      setGuestMessages((prev) => {
        // 将现有数据转换为带位置信息的格式
        const existingItems = prev.map((url, index) => ({
          url,
          position: index,
        }));

        // 过滤掉null值，只保留有效的URL
        const validExistingItems = existingItems.filter(
          (item) => item.url !== null
        );

        // 获取新的有效项目
        const validNewItems = newVipList.filter(
          (item: { url: string; position: number } | null) => item !== null
        );

        // 合并现有和新项目
        const allItems = [...validExistingItems, ...validNewItems];

        // 按位置排序
        const sortedItems = allItems.sort((a, b) => a.position - b.position);

        // 转换为字符串数组，保持null位置
        const result: (string | null)[] = [];
        sortedItems.forEach((item) => {
          // 确保数组长度足够
          while (result.length <= item.position) {
            result.push(null);
          }
          result[item.position] = item.url;
        });

        return result;
      });

      // 处理 messages 数据：每次请求都重新构建消息列表
      setMessages((prev) => {
        // 将接口返回的数据转换为消息格式
        const interfaceMessages: PositionedMessage[] = newList.map(
          (url: string) => {
            // 检查是否已存在（基于URL，去掉时间戳）
            const baseUrl = url.split("&t=")[0];
            const existingMessage = prev.find(
              (msg) => msg.url.split("&t=")[0] === baseUrl
            );

            if (existingMessage) {
              // 如果已存在，保持原有位置和状态，不添加动画
              return {
                ...existingMessage,
                hasAnimation: false, // 确保没有动画
              };
            } else {
              // 如果是新消息，计算新位置并添加动画
              const { x, y } = generateRandomPosition(prev);
              const messageId =
                Date.now().toString() + Math.random().toString();
              const newMessage = {
                url: url,
                x,
                y,
                id: messageId,
                hasAnimation: true, // 只有新消息添加动画
              };

              // 为新消息设置动画停止定时器
              setTimeout(() => {
                setMessages((currentMessages) =>
                  currentMessages.map((currentMsg) =>
                    currentMsg.id === newMessage.id
                      ? { ...currentMsg, hasAnimation: false }
                      : currentMsg
                  )
                );
              }, ANIMATION_DURATION);

              return newMessage;
            }
          }
        );

        // 保留最后50个消息
        const finalMessages = interfaceMessages.slice(-50);
        return finalMessages;
      });
    } catch (error) {
      console.log(error);
    } finally {
      setTimeout(() => {
        setSigList(50, 5);
      }, 3000);
    }
  };

  return (
    <div className="w-full h-screen relative overflow-hidden bg-[url('/sig-show_bg.png')] bg-cover bg-center">
      {/* guestMessages 居中 */}
      <div className="w-[1200px] h-[519px] absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] flex justify-center items-center gap-4 z-10">
        {guestMessages.map((item, index) => (
          <React.Fragment key={index}>
            {item ? (
              <img
                src={item || "/"}
                alt="guest"
                width={198}
                height={282}
                className={`w-[198px] h-[282px] object-contain bg-transparent transition-opacity duration-300 ${
                  initialAnimationActive
                    ? "animate__animated animate__pulse animate__infinite"
                    : ""
                } guest-message-${index}`}
                onError={(e) => {
                  // 图片加载失败时隐藏元素
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="w-[198px] h-[282px] bg-transparent"></div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* messages 随机分布 */}
      {messages.map((item) => (
        <img
          key={item.id}
          src={item.url}
          alt="sig"
          width={198}
          height={282}
          className={`absolute w-[198px] h-[282px] object-contain bg-transparent transition-opacity duration-300 ${
            initialAnimationActive || item.hasAnimation
              ? "animate__animated animate__pulse animate__infinite"
              : ""
          }`}
          style={{
            top: item.y,
            left: item.x,
          }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ))}
    </div>
  );
}
