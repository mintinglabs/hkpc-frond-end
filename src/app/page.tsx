"use client";
import React, { useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { uploadSigFile } from "../../apis/business";
import Image from "next/image";
import FullSpin from "../../components/FullSpin";
import "animate.css";
// import { useWebSocket } from "../../hooks/websocket";

const GUEST_LIST = ["嘉賓 1", "嘉賓 2", "嘉賓 3", "嘉賓 4", "嘉賓 5"];

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
  const [imageAnimation, setImageAnimation] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState(false);

  const [guestId, setGuestId] = useState(0);

  const [randomColor, setRandomColor] = useState(0);
  const [randomShield, setRandomShield] = useState(0);

  const resetColorRandom = () => {
    setRandomColor(Math.floor(Math.random() * 3));
    setRandomShield(Math.floor(Math.random() * 3));
  };

  useEffect(() => {
    resetColorRandom();
  }, []);

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
  // 压缩图片的函数，固定99x141容器，图片居中显示
  const compressImage = (
    canvas: HTMLCanvasElement,
    targetSizeKB: number = 500
  ): Promise<Blob> => {
    return new Promise((resolve) => {
      const compressWithSize = (maxWidth: number): void => {
        // 固定容器尺寸，按比例放大以提高清晰度
        const containerWidth = 625;
        const containerHeight = 900;

        // 计算图片在容器中的显示尺寸，保持宽高比
        const imageAspectRatio = canvas.width / canvas.height;
        const containerAspectRatio = containerWidth / containerHeight;

        let imageWidth, imageHeight;
        let offsetX, offsetY;

        if (imageAspectRatio > containerAspectRatio) {
          // 图片更宽，以宽度为准
          imageWidth = containerWidth * 0.8; // 留20%边距
          imageHeight = imageWidth / imageAspectRatio;
          offsetX = (containerWidth - imageWidth) / 2;
          offsetY = (containerHeight - imageHeight) / 2;
        } else {
          // 图片更高，以高度为准
          imageHeight = containerHeight * 0.8; // 留20%边距
          imageWidth = imageHeight * imageAspectRatio;
          offsetX = (containerWidth - imageWidth) / 2;
          offsetY = (containerHeight - imageHeight) / 2;
        }

        // 创建固定尺寸的canvas
        const compressedCanvas = document.createElement("canvas");
        const compressedCtx = compressedCanvas.getContext("2d");
        if (!compressedCtx) {
          canvas.toBlob((blob) => {
            resolve(blob || new Blob());
          }, "image/png");
          return;
        }

        // 设置固定尺寸
        compressedCanvas.width = containerWidth;
        compressedCanvas.height = containerHeight;

        // 绘制图片到容器中，居中显示
        compressedCtx.drawImage(
          canvas,
          offsetX,
          offsetY,
          imageWidth,
          imageHeight
        );

        // 转换为blob，使用PNG格式保持透明
        compressedCanvas.toBlob((blob) => {
          if (!blob) {
            resolve(new Blob());
            return;
          }

          // 检查文件大小
          const sizeKB = blob.size / 1024;
          if (sizeKB <= targetSizeKB || maxWidth <= 400) {
            resolve(blob);
          } else {
            // 如果文件还是太大，继续缩小尺寸
            compressWithSize(maxWidth - 50);
          }
        }, "image/png");
      };

      // 从1200开始压缩
      compressWithSize(1200);
    });
  };

  const save = async () => {
    if (!hasSig) return;
    const canvas = sigRef?.current?.getCanvas();
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 固定容器尺寸，按比例放大以提高清晰度
    const containerWidth = 625;
    const containerHeight = 900;

    // 加载并绘制背景图片
    const bgImage = new window.Image();
    bgImage.crossOrigin = "anonymous";

    bgImage.onload = async () => {
      try {
        setHasLoading(true);

        // 创建固定尺寸的临时canvas
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) return;

        // 设置固定尺寸
        tempCanvas.width = containerWidth;
        tempCanvas.height = containerHeight;

        // 计算背景图片在容器中的显示尺寸，保持宽高比
        const bgAspectRatio = bgImage.width / bgImage.height;
        const containerAspectRatio = containerWidth / containerHeight;

        let bgWidth, bgHeight;
        let bgX, bgY;

        if (bgAspectRatio > containerAspectRatio) {
          // 背景图片更宽，以宽度为准
          bgWidth = containerWidth * 0.9; // 留10%边距
          bgHeight = bgWidth / bgAspectRatio;
          bgX = (containerWidth - bgWidth) / 2;
          bgY = (containerHeight - bgHeight) / 2;
        } else {
          // 背景图片更高，以高度为准
          bgHeight = containerHeight * 0.9; // 留10%边距
          bgWidth = bgHeight * bgAspectRatio;
          bgX = (containerWidth - bgWidth) / 2;
          bgY = (containerHeight - bgHeight) / 2;
        }

        // 先绘制背景图片
        tempCtx.drawImage(bgImage, bgX, bgY, bgWidth, bgHeight);

        // 再绘制签名内容，签名覆盖在背景上
        tempCtx.drawImage(canvas, 0, 0, containerWidth, containerHeight);

        // 压缩图片到500KB以下
        const compressedBlob = await compressImage(tempCanvas, 500);

        // 获取压缩后的dataURL用于显示
        const dataUrl = URL.createObjectURL(compressedBlob);
        setDataURL(dataUrl);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: any = await uploadSigFile(
          { file: compressedBlob as File },
          guestMode ? 1 : 0,
          guestMode ? guestId : undefined
        );

        if (res.code === 200) {
          if (!guestMode) {
            setHasPromise(true);
            // 动画完成后重置状态
            setTimeout(() => {
              setImageAnimation(false);
            }, 600);
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

    bgImage.src = guestMode
      ? "/an_guest.png"
      : ["/an.png", "/an1.png", "/an2.png"][randomShield];
  };

  const [promiseAnimation, setPromiseAnimation] = useState(true);
  const sendPromise = () => {
    setPromiseAnimation(false);
    setTimeout(() => {
      setHasSuccess(true);
      // 在 hasSuccess 设置为 true 后，延迟一点再开始动画
      setTimeout(() => {
        setSuccessAnimation(true);
      }, 50);
    }, 600);
  };

  const openDisplayMenu = () => {
    setSaveCount(saveCount + 1);
    setTimeout(() => {
      if (saveCount >= 3) {
        setGuestMode(!guestMode);
        // 初始化所有状态
        setGusetStartSig(false); // 嘉賓位置編號
        setHasSig(false); // 簽名
        setHasPromise(false); // 承諾
        setHasSuccess(false); // 成功
        setImageAnimation(false); // 圖片動畫
        setPromiseAnimation(true); // 承諾動畫
        setSuccessAnimation(false); // 成功動畫
        setSaveCount(0);

        // 清除畫板
        sigRef?.current?.clear();
        return;
      }
      setSaveCount(0);
    }, 1000);
  };

  useEffect(() => {
    if (hasSuccess) {
      if (guestMode) {
        setHasThanks(false);
        return;
      }
      setTimeout(() => {
        setHasThanks(false);
      }, 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSuccess]);
  return (
    <div className="signature-page">
      {!hasSuccess && (
        <>
          {hasPromise ? (
            <>
              <div style={{ marginBottom: 52 }}>「國家安全，人人有責」</div>
              <div
                className={`promise-page animate__animated ${
                  promiseAnimation ? "animate__fadeIn" : "animate__fadeOut"
                }`}
              >
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
                <div
                  style={{
                    textAlign: "left",
                    marginTop: 37,
                    userSelect: "none",
                  }}
                >
                  我承諾繼續推廣國家安全，鼓勵大家共同築建國安護盾以守護家園，並邀請親友一同肩負這份責任，以實際行動共同維護國家的和諧與穩定。
                </div>
                {promiseAnimation && (
                  <Image
                    style={{
                      position: "absolute",
                      bottom: !imageAnimation ? 48 : "50%",
                      right: !imageAnimation ? 48 : "50%",
                      transform: !imageAnimation
                        ? "scale(1)"
                        : "translate(50%, 50%) scale(4.0)",
                      transition:
                        "all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                      zIndex: imageAnimation ? 1 : 1000,
                    }}
                    src={dataURL}
                    alt="promise"
                    width={150}
                    height={180}
                  />
                )}

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
                style={{
                  marginTop: 55,
                  boxShadow: !promiseAnimation
                    ? "none"
                    : "0px 4px 4px 0px #0000001F",
                }}
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
              {guestMode && !gusetStartSig && (
                <div className="animate__animated animate__fadeIn">
                  嘉賓位置編號
                </div>
              )}
              {!guestMode || gusetStartSig ? (
                <div className="animate__animated animate__fadeIn">
                  請在盾上簽名
                </div>
              ) : null}
              {(!guestMode || gusetStartSig) && (
                <div className="animate__animated animate__fadeIn">
                  <SignatureCanvas
                    ref={sigRef}
                    penColor={
                      guestMode
                        ? "#782280"
                        : ["#0040A4", "#6CBAFF", "#0087D4"][randomColor]
                    }
                    minWidth={2} // 最小笔触宽度
                    maxWidth={8}
                    onBegin={() => {
                      setHasSig(true);
                    }}
                    canvasProps={{
                      className: "sig-canvas",
                      style: {
                        width: "100%",
                        height: "100%",
                        backgroundImage: `url(${
                          guestMode
                            ? "/an_guest.png"
                            : ["/an.png", "/an1.png", "/an2.png"][randomShield]
                        })`,
                      },
                    }}
                  />

                  <div className="signature-buttons animate__animated animate__fadeIn">
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
                      onClick={() => {
                        setImageAnimation(true);
                        setTimeout(() => {
                          save();
                        }, 50);
                      }}
                    >
                      {!guestMode ? "確認" : "送出承諾"}
                    </button>
                    <div
                      style={{
                        width: "100%",
                        height: "92px",
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {guestMode && !gusetStartSig && (
                <div className="guest-list animate__animated animate__fadeIn">
                  {GUEST_LIST.map((item, index) => (
                    <div
                      className="guest-list-item"
                      key={index}
                      onClick={() => {
                        setGusetStartSig(true);

                        setGuestId(index);
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
            <div className="promise-page-copy">
              <Image
                style={{
                  position: "absolute",
                  bottom: !successAnimation ? 48 : "50%",
                  right: !successAnimation ? 48 : "50%",
                  transform: !successAnimation
                    ? "scale(1)"
                    : "translate(50%, 50%) scale(4.0)",
                  transition: "all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  zIndex: successAnimation ? 1 : 1000,
                }}
                src={dataURL}
                alt="promise"
                width={150}
                height={180}
              />
            </div>
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
                <span style={{ marginLeft: 20, letterSpacing: 3.2 }}>
                  感謝參與！
                </span>
              </div>
              <button
                className={`clear-button `}
                style={{ position: "absolute", bottom: 92 }}
                onClick={() => {
                  // 初始化所有状态
                  setGuestId(0);
                  setGusetStartSig(false);
                  setGuestMode(guestMode);
                  setHasSig(false);
                  setHasPromise(false);
                  setHasSuccess(false);
                  setImageAnimation(false);
                  setPromiseAnimation(true);
                  setSuccessAnimation(false);
                  setHasThanks(true);
                  resetColorRandom();
                }}
              >
                返回主頁
              </button>
            </>
          )}
        </div>
      )}

      <div onClick={openDisplayMenu} className="display-menu"></div>

      <FullSpin open={hasLoading} />
    </div>
  );
}
