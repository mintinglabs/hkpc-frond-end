import React from "react";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
interface FullSpinProps {
  open: boolean;
  text?: string;
}

const InternalFullSpin = React.forwardRef<HTMLDivElement, FullSpinProps>(
  (
    { open },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _ref
  ) => {
    // useEffect(() => {
    //   if (open) {
    //     document.body.style.overflow = 'hidden';
    //   } else {
    //     document.body.style.overflow = '';
    //   }
    //   // 组件卸载时恢复
    //   return () => {
    //     document.body.style.overflow = '';
    //   };
    // }, [open]);

    return (
      <>
        {open && (
          <div className="full-spin-overlay">
            <div className="full-spin-container">
              <Spin
                indicator={
                  <LoadingOutlined
                    style={{ color: "#FFE7FF", fontSize: 40 }}
                    spin
                  />
                }
                size="large"
              />
            </div>
          </div>
        )}
      </>
    );
  }
);

InternalFullSpin.displayName = "EcFullSpin";

const FullSpin = React.memo(InternalFullSpin);

export default FullSpin;
