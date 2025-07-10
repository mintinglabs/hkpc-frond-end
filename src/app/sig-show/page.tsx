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
  mt: number;
  ml: number;
};

type GuestMessage = {
  url: string;
  hasAnimation: boolean;
};

export default function Home() {
  const [messages, setMessages] = useState<PositionedMessage[]>([]);
  const [guestMessages, setGuestMessages] = useState<(GuestMessage | null)[]>(
    []
  );
  const [initialAnimationActive, setInitialAnimationActive] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [animatedMessageIds, setAnimatedMessageIds] = useState<Set<string>>(
    new Set()
  );

  const animationTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const ANIMATION_DURATION = 10000; // 10秒

  // 中心区域禁区，避开 guestMessages（假设它大约在屏幕中心，1000x419 区域）
  const centerExclusionZone = useRef({
    x: 0,
    y: 0,
    width: 800,
    height: 319,
  });
  useEffect(() => {
    centerExclusionZone.current = {
      x: window.innerWidth / 2 - 400,
      y: window.innerHeight / 2 - 109,
      width: 800,
      height: 319,
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
    const imageWidth = 140;
    const imageHeight = 198;
    const minDistance = imageWidth + 40; // 增加最小距离

    return positions.some((pos) => {
      const distanceX = Math.abs(pos.x - x);
      const distanceY = Math.abs(pos.y - y);

      // 使用更严格的重叠检测：矩形相交 + 最小距离
      const isRectOverlapping =
        distanceX < imageWidth && distanceY < imageHeight;
      const isTooClose = distanceX < minDistance && distanceY < minDistance;

      return isRectOverlapping || isTooClose;
    });
  };

  const isInsideCenterZone = (x: number, y: number) => {
    const imageWidth = 140;
    const imageHeight = 198;
    return (
      x + imageWidth > centerExclusionZone.current.x &&
      x < centerExclusionZone.current.x + centerExclusionZone.current.width &&
      y + imageHeight > centerExclusionZone.current.y &&
      y < centerExclusionZone.current.y + centerExclusionZone.current.height
    );
  };

  // 优化的随机位置算法 - 使用网格系统和智能分布
  const generateRandomPosition = (
    currentMessages: PositionedMessage[]
  ): { x: number; y: number } => {
    const imageWidth = 140;
    const imageHeight = 198;
    const padding = 25; // 调整间距以适应新的图片尺寸
    const screenPadding = 160; // 屏幕边界 padding 增加到 200px

    // 获取当前所有消息的位置，用于重叠检查
    const currentPositions = currentMessages.map((msg) => ({
      x: msg.x,
      y: msg.y,
    }));

    console.log(`生成位置 - 当前消息数: ${currentPositions.length}`);

    // 策略1: 网格系统分配
    const gridSize = imageWidth + padding;
    const availableWidth = window.innerWidth - imageWidth - screenPadding * 2;
    const availableHeight =
      window.innerHeight - imageHeight - screenPadding * 2;
    const cols = Math.floor(availableWidth / gridSize);
    const rows = Math.floor(availableHeight / gridSize);

    console.log(`网格计算: ${cols}列 x ${rows}行 = ${cols * rows}个网格位置`);

    // 创建可用网格列表
    const availableGrids: { x: number; y: number }[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * gridSize + screenPadding;
        const y = row * gridSize + screenPadding;

        // 检查是否在中心禁区
        if (isInsideCenterZone(x, y)) {
          console.log(`网格位置 (${col}, ${row}) 在中心禁区，跳过`);
          continue;
        }

        // 检查是否与现有消息重叠
        const isOccupied = currentPositions.some(
          (pos) =>
            Math.abs(pos.x - x) < gridSize && Math.abs(pos.y - y) < gridSize
        );

        if (!isOccupied) {
          availableGrids.push({ x, y });
        } else {
          console.log(`网格位置 (${col}, ${row}) 被占用，跳过`);
        }
      }
    }

    console.log(`可用网格数量: ${availableGrids.length}`);

    // 如果有可用网格，随机选择一个
    if (availableGrids.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableGrids.length);
      const selectedGrid = availableGrids[randomIndex];
      console.log(`选择网格位置: (${selectedGrid.x}, ${selectedGrid.y})`);
      return selectedGrid;
    }

    // 策略2: 径向分布（当网格不够用时）
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const maxRadius =
      Math.min(window.innerWidth, window.innerHeight) / 2 -
      imageWidth -
      screenPadding;

    for (let attempt = 0; attempt < 100; attempt++) {
      const radius = 200 + Math.random() * (maxRadius - 200);
      const angle = Math.random() * 2 * Math.PI;

      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      // 确保在边界内（考虑屏幕 padding）
      const boundedX = Math.max(
        screenPadding,
        Math.min(window.innerWidth - imageWidth - screenPadding, x)
      );
      const boundedY = Math.max(
        screenPadding,
        Math.min(window.innerHeight - imageHeight - screenPadding, y)
      );

      if (
        !isInsideCenterZone(boundedX, boundedY) &&
        !isOverlapping(boundedX, boundedY, currentPositions)
      ) {
        return { x: boundedX, y: boundedY };
      }
    }

    // 策略3: 边缘区域分布（考虑屏幕 padding）
    const edgeZones = [
      {
        x: screenPadding,
        y: screenPadding,
        width: 300,
        height: window.innerHeight - screenPadding * 2,
      },
      {
        x: window.innerWidth - 300 - screenPadding,
        y: screenPadding,
        width: 300,
        height: window.innerHeight - screenPadding * 2,
      },
      {
        x: screenPadding,
        y: screenPadding,
        width: window.innerWidth - screenPadding * 2,
        height: 300,
      },
      {
        x: screenPadding,
        y: window.innerHeight - 300 - screenPadding,
        width: window.innerWidth - screenPadding * 2,
        height: 300,
      },
    ];

    for (const zone of edgeZones) {
      for (let i = 0; i < 30; i++) {
        const x = zone.x + Math.random() * (zone.width - imageWidth);
        const y = zone.y + Math.random() * (zone.height - imageHeight);

        if (
          !isInsideCenterZone(x, y) &&
          !isOverlapping(x, y, currentPositions)
        ) {
          return { x, y };
        }
      }
    }

    // 策略4: 智能随机分布（考虑屏幕 padding）
    for (let i = 0; i < 200; i++) {
      const x =
        screenPadding +
        Math.random() * (window.innerWidth - imageWidth - screenPadding * 2);
      const y =
        screenPadding +
        Math.random() * (window.innerHeight - imageHeight - screenPadding * 2);

      if (!isInsideCenterZone(x, y) && !isOverlapping(x, y, currentPositions)) {
        return { x, y };
      }
    }

    // 最后的fallback：找一个相对空旷的区域（考虑屏幕 padding）
    const quadrants = [
      {
        x: screenPadding,
        y: screenPadding,
        width: (window.innerWidth - screenPadding * 2) / 2,
        height: (window.innerHeight - screenPadding * 2) / 2,
      },
      {
        x: screenPadding + (window.innerWidth - screenPadding * 2) / 2,
        y: screenPadding,
        width: (window.innerWidth - screenPadding * 2) / 2,
        height: (window.innerHeight - screenPadding * 2) / 2,
      },
      {
        x: screenPadding,
        y: screenPadding + (window.innerHeight - screenPadding * 2) / 2,
        width: (window.innerWidth - screenPadding * 2) / 2,
        height: (window.innerHeight - screenPadding * 2) / 2,
      },
      {
        x: screenPadding + (window.innerWidth - screenPadding * 2) / 2,
        y: screenPadding + (window.innerHeight - screenPadding * 2) / 2,
        width: (window.innerWidth - screenPadding * 2) / 2,
        height: (window.innerHeight - screenPadding * 2) / 2,
      },
    ];

    // 找到消息最少的象限
    const quadrantCounts = quadrants.map((quadrant, index) => {
      const count = currentPositions.filter(
        (pos) =>
          pos.x >= quadrant.x &&
          pos.x < quadrant.x + quadrant.width &&
          pos.y >= quadrant.y &&
          pos.y < quadrant.y + quadrant.height
      ).length;
      return { index, count };
    });

    const leastCrowdedQuadrant = quadrantCounts.reduce((a, b) =>
      a.count < b.count ? a : b
    );
    const quadrant = quadrants[leastCrowdedQuadrant.index];

    return {
      x: quadrant.x + Math.random() * (quadrant.width - imageWidth),
      y: quadrant.y + Math.random() * (quadrant.height - imageHeight),
    };
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
        const existingItems = prev.map((item, index) => ({
          url: item?.url || "",
          position: index,
        }));

        // 过滤掉null值，只保留有效的URL
        const validExistingItems = existingItems.filter(
          (item) => item.url !== ""
        );

        // 获取新的有效项目
        const validNewItems = newVipList.filter(
          (item: { url: string; position: number } | null) => item !== null
        );

        // 合并现有和新项目
        const allItems = [...validExistingItems, ...validNewItems];

        // 按位置排序
        const sortedItems = allItems.sort((a, b) => a.position - b.position);

        // 转换为带动画信息的数组，保持null位置
        const result: (GuestMessage | null)[] = [];
        sortedItems.forEach((item) => {
          // 确保数组长度足够
          while (result.length <= item.position) {
            result.push(null);
          }

          // 检查是否是新消息（在现有数据中不存在）
          const isNewMessage = !validExistingItems.some(
            (existing) => existing.url === item.url
          );

          result[item.position] = {
            url: item.url,
            hasAnimation: isNewMessage,
          };

          // 为新消息设置动画停止定时器
          if (isNewMessage) {
            setTimeout(() => {
              setGuestMessages((currentMessages) =>
                currentMessages.map((currentMsg, idx) =>
                  idx === item.position && currentMsg
                    ? { ...currentMsg, hasAnimation: false }
                    : currentMsg
                )
              );
            }, ANIMATION_DURATION);
          }
        });

        return result;
      });

      // 处理 messages 数据：每次请求都重新构建消息列表
      setMessages((prev) => {
        // 将接口返回的数据转换为消息格式
        const interfaceMessages: PositionedMessage[] = [];

        for (let i = 0; i < newList.length; i++) {
          const url = newList[i];
          // 检查是否已存在（基于URL，去掉时间戳）
          const baseUrl = url.split("&t=")[0];
          const existingMessage = prev.find(
            (msg) => msg.url.split("&t=")[0] === baseUrl
          );

          if (existingMessage) {
            // 如果已存在，保持原有位置和状态，不添加动画
            interfaceMessages.push({
              ...existingMessage,
              hasAnimation: false, // 确保没有动画
            });
          } else {
            // 如果是新消息，计算新位置并添加动画
            console.log("当前prev:", prev);
            console.log("当前interfaceMessages:", interfaceMessages);

            // 创建一个临时的消息数组，包含当前已处理的消息
            const tempMessages = [...prev, ...interfaceMessages];

            const { x, y } = generateRandomPosition(tempMessages);
            console.log("生成新位置:", { x, y });
            const messageId = Date.now().toString() + Math.random().toString();
            const newMessage = {
              url: url,
              x,
              y,
              mt: Math.random() * 50,
              ml: Math.random() * 50,
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

            interfaceMessages.push(newMessage);
          }
        }

        // 保留最后50个消息
        const finalMessages = interfaceMessages.slice(-50);

        // 添加调试信息
        const newCount = finalMessages.filter((msg) => msg.hasAnimation).length;
        if (newCount > 0) {
          console.log(
            `优化算法生成 ${newCount} 个新位置，当前总消息数: ${finalMessages.length}，边界padding: 100px`
          );
        }

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
      <div className="w-[800px] h-[319px] absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] flex justify-center items-center gap-4 z-10">
        {guestMessages.map((item, index) => (
          <React.Fragment key={index}>
            {item ? (
              <img
                src={item.url || "/"}
                alt="guest"
                width={168}
                height={238}
                className={`w-[168px] h-[238px] object-contain bg-transparent transition-all duration-300 ${
                  initialAnimationActive || item.hasAnimation
                    ? "animate__animated animate__pulse animate__infinite"
                    : ""
                } guest-message-${index} ${
                  !initialAnimationActive && item.hasAnimation
                    ? "scale-[5] z-[100]"
                    : "scale-[1] z-0"
                } `}
                onError={(e) => {
                  // 图片加载失败时隐藏元素
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="w-[168px] h-[238px] bg-transparent"></div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* messages 随机分布 */}
      {/* <div className="w-full h-full absolute top-0 left-0 flex flex-wrap"> */}
      {messages.map((item) => (
        <div key={item.id} className="animate__animated animate__fadeIn">
          <img
            src={item.url}
            alt="sig"
            width={140}
            height={198}
            className={`absolute w-[140px] h-[198px] object-contain bg-transparent transition-all duration-300 ${
              initialAnimationActive || item.hasAnimation
                ? "animate__animated animate__pulse animate__infinite"
                : ""
            } ${
              !initialAnimationActive && item.hasAnimation
                ? "scale-[2] z-[100]"
                : "scale-[1] z-0"
            } 
              
            `}
            style={{
              top: item.y,
              left: item.x,
              marginTop: item.mt,
              marginLeft: item.ml,
            }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      ))}
      {/* </div> */}
    </div>
  );
}
