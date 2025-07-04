"use client";
import React, { useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { uploadSigFile } from "../../apis/business";
import Image from "next/image";
import FullSpin from "../../components/FullSpin";
// import { useWebSocket } from "../../hooks/websocket";

const GUEST_LIST = ["嘉宾 1", "嘉宾 2", "嘉宾 3", "嘉宾 4", "嘉宾 5"];

export default function Home() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sigRef: any = useRef(null);
  const [hasSig, setHasSig] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [clearCount, setClearCount] = useState(0);
  const [guestMode, setGuestMode] = useState(false);
  const [gusetStartSig, setGusetStartSig] = useState(false);
  const [hasLoading, setHasLoading] = useState(false);
  const [hasPromise, setHasPromise] = useState(false);
  const [hasSuccess, setHasSuccess] = useState(false);
  const [dataURL, setDataURL] = useState("");
  const [hasThanks, setHasThanks] = useState(true);

  const clear = () => {
    setClearCount(clearCount + 1);
    setTimeout(() => {
      if (clearCount >= 3) {
        window.location.reload();
        setClearCount(0);
        return;
      }
      setClearCount(0);
    }, 500);

    if (!hasSig) return;
    setHasSig(false);
    sigRef?.current?.clear();
  };
  const save = async () => {
    if (!hasSig) return;
    const canvas = sigRef?.current?.getCanvas();
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 创建临时 canvas 来合并背景和签名
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // 设置临时 canvas 尺寸
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    // 背景图片配置
    const bgConfig = {
      widthRatio: 0.8, // 宽度比例 60%
      heightRatio: 0.8, // 高度比例 80%（可选，如果不想按比例）
      useAspectRatio: true, // 是否保持宽高比
    };

    // 加载并绘制背景图片
    const bgImage = new window.Image();
    bgImage.crossOrigin = "anonymous";

    bgImage.onload = async () => {
      try {
        setHasLoading(true);
        // 计算背景图片的尺寸
        const bgWidth = tempCanvas.width * bgConfig.widthRatio;
        let bgHeight;

        if (bgConfig.useAspectRatio) {
          // 按原始图片比例计算高度
          bgHeight = (bgImage.height / bgImage.width) * bgWidth;
        } else {
          // 使用自定义高度比例
          bgHeight = tempCanvas.height * bgConfig.heightRatio;
        }

        // 计算背景图片的位置（居中）
        const bgX = (tempCanvas.width - bgWidth) / 2;
        const bgY = (tempCanvas.height - bgHeight) / 2;

        // 先绘制背景图片
        tempCtx.drawImage(bgImage, bgX, bgY, bgWidth, bgHeight);

        // 再绘制签名内容
        tempCtx.drawImage(canvas, 0, 0);

        // 获取合并后的数据
        const dataUrl = tempCanvas.toDataURL("image/png");
        setDataURL(dataUrl);
        // 转换为 blob
        const base64 = dataUrl.split(",")[1];
        const binary = atob(base64);
        const len = binary.length;
        const buffer = new Uint8Array(len);

        for (let i = 0; i < len; i++) {
          buffer[i] = binary.charCodeAt(i);
        }

        const blob = new Blob([buffer], { type: "image/png" });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: any = await uploadSigFile(
          { file: blob as File },
          guestMode ? 1 : 0,
          "ab.png"
        );

        if (res.code === 200) {
          if (!guestMode) {
            setHasPromise(true);
            return;
          }
          setHasSuccess(true);
        }

        // 清除画板
        clear();
        setHasSig(false);
      } catch (e) {
        console.log(e);
      } finally {
        setHasLoading(false);
      }
    };

    bgImage.src = guestMode ? "/an_guest.png" : "/an.png";
  };

  const sendPromise = () => {
    setHasSuccess(true);
  };

  const openDisplayMenu = () => {
    setSaveCount(saveCount + 1);
    setTimeout(() => {
      if (saveCount >= 5) {
        setGuestMode(!guestMode);
        setSaveCount(0);
        return;
      }
      setSaveCount(0);
    }, 1000);
  };

  useEffect(() => {
    if (hasSuccess) {
      setTimeout(() => {
        setHasThanks(false);
      }, 3000);
    }
  }, [hasSuccess]);
  return (
    <div className="signature-page">
      {!hasSuccess && (
        <>
          {hasPromise ? (
            <>
              <div style={{ marginBottom: 52 }}>「國家安全，人人有責」</div>
              <div className="promise-page">
                <Image
                  style={{
                    position: "absolute",
                    top: 44,
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                  src="/border.png"
                  alt="promise"
                  width={442}
                  height={7}
                />
                <div style={{ textAlign: "left", marginTop: 88 }}>
                  我承諾繼續推廣國家安全，鼓勵大家共同築建國安護盾以守護家園，並邀請親友一同肩負這份責任，以實際行動共同維護國家的和諧與穩定。
                </div>
                <Image
                  style={{
                    position: "absolute",
                    bottom: 48,
                    right: 78,
                  }}
                  src={dataURL}
                  alt="promise"
                  width={150}
                  height={180}
                />
                <Image
                  style={{
                    position: "absolute",
                    bottom: 44,
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                  src="/border.png"
                  alt="promise"
                  width={442}
                  height={7}
                />
              </div>
              <button
                style={{ marginTop: 55 }}
                className={`confirm-button ${!hasSig ? "button-disabled" : ""}`}
                onClick={sendPromise}
              >
                送出承諾
              </button>
            </>
          ) : (
            <>
              {guestMode && (
                <>
                  <div className="guest-top" />
                  <div className="guest-bottom" />
                </>
              )}
              {guestMode && !gusetStartSig && <div>嘉賓位置編號</div>}
              {!guestMode || gusetStartSig ? <div>請在盾上簽名</div> : null}
              {(!guestMode || gusetStartSig) && (
                <div>
                  <SignatureCanvas
                    ref={sigRef}
                    penColor={guestMode ? "#782280" : "#0040A4"}
                    minWidth={5} // 最小笔触宽度
                    maxWidth={10}
                    onBegin={() => {
                      setHasSig(true);
                    }}
                    canvasProps={{
                      className: "sig-canvas",
                      style: {
                        width: "100%",
                        height: "100%",
                        backgroundImage: `url(${
                          guestMode ? "/an_guest.png" : "/an.png"
                        })`,
                      },
                    }}
                  />

                  <div className="signature-buttons">
                    <button
                      className={`clear-button ${
                        !hasSig ? "button-disabled" : ""
                      }`}
                      onClick={clear}
                    >
                      <Image
                        src="/pepicons-pop_reload.svg"
                        alt="clear"
                        width={40}
                        height={40}
                      />
                      清除
                    </button>
                    <button
                      className={`confirm-button ${
                        !hasSig ? "button-disabled" : ""
                      }`}
                      onClick={save}
                    >
                      確認
                    </button>
                    <div
                      onClick={openDisplayMenu}
                      className="display-menu"
                    ></div>
                  </div>
                </div>
              )}

              {guestMode && !gusetStartSig && (
                <div className="guest-list">
                  {GUEST_LIST.map((item, index) => (
                    <div
                      className="guest-list-item"
                      key={index}
                      onClick={() => {
                        setGusetStartSig(true);
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {hasSuccess && (
        <div className="success-page">
          {hasThanks && (
            <>
              <Image src={dataURL} alt="success" width={520} height={604} />
            </>
          )}

          {!hasThanks && (
            <>
              <div className="success-content">
                <Image
                  src="/success.png"
                  alt="success"
                  width={170}
                  height={170}
                />
                感謝參與！
              </div>
              <button
                className={`clear-button `}
                style={{ position: "absolute", bottom: 92 }}
                onClick={() => {
                  window.location.reload();
                }}
              >
                返回主頁
              </button>
            </>
          )}
        </div>
      )}

      <FullSpin open={hasLoading} />
    </div>
  );
}
