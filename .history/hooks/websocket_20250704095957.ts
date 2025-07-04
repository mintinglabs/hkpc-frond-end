import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useSocket(serverUrl: string, onMessage: (data: any) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // 配置 Socket.IO
    socketRef.current = io(serverUrl, {
      transports: ["websocket"],
      reconnection: true, // 启用重连
      reconnectionAttempts: 5, // 重试5次
      reconnectionDelay: 1000, // 重连延迟
      timeout: 10000, // 连接超时时间
    });

    // 连接成功
    socketRef.current.on("connect", () => {
      console.log("Connected to socket.io server");
    });

    // 连接错误
    socketRef.current.on("connect _error", (error) => {
      console.error("Connection error:", error);
    });

    // 断开连接
    socketRef.current.on("disconnect", (reason) => {
      console.log("Disconnected:", reason);
    });

    // 接收消息
    socketRef.current.on("message", (data) => {
      onMessage(data);
      const message = JSON.parse(data.message);
      // 确认收到消息
      socketRef?.current?.emit(
        "message",
        JSON.stringify({ event: "ackdata", dataId: message.idata.id })
      );
    });

    // 监听错误
    socketRef.current.on("connect_error", (err) => {
      console.error("Socket connect error:", err);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [serverUrl, onMessage]);

  // 返回 socket 实例，方便外部使用
  return socketRef.current;
}
