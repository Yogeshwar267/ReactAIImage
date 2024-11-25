// FooterActions.js
import React from "react";
import { Camera, Folder, SwitchCamera } from "lucide-react";

const FooterActions = ({
  isProcessing,
  generateImage,
  openFilePicker,
  handleFileChange,
  setIsFrontCamera,
  colors,
  outputImage,
  snapshot,
  playButtonPress,
  fileInputRef
}) => {
  const buttonClass = `
    relative group overflow-hidden
    bg-${colors.primary}-900/10 hover:bg-${colors.primary}-800/20 text-${colors.text} p-[15px]
    rounded-xl backdrop-blur-md transition-all duration-300 
    border border-${colors.text}/20 hover:border-${colors.text}/50
    shadow-lg shadow-${colors.glow}/20
  `;

  const iconClass = (isProcessing) => `
    w-8 h-8 group-hover:scale-110 transition-transform ${
      isProcessing ? "animate-pulse" : ""
    }
  `;

  return (
      <div className="flex justify-center items-center space-x-8 custom-footer-spacing">
        {!outputImage?.length && !snapshot?.length ? (
          <>
            <button
              onClick={generateImage}
              disabled={isProcessing}
              className={`${buttonClass} ${
                isProcessing ? "opacity-50 cursor-not-allowed" : ""
              }`}
              style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
            >
              <Camera className={iconClass(isProcessing)} />
            </button>

            <button
              onClick={openFilePicker}
              className={buttonClass}
              style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
            >
              <Folder className="w-8 h-8 group-hover:scale-110 transition-transform" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden-input"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Windows Phone/i.test(
              navigator.userAgent
            ) && (
              <button
                onClick={() => {
                  playButtonPress();
                  setIsFrontCamera((prev) => !prev);
                }}
                disabled={isProcessing}
                className={`${buttonClass} ${
                  isProcessing ? "opacity-50 cursor-not-allowed" : ""
                }`}
                style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
              >
                <SwitchCamera className={iconClass(isProcessing)} />
              </button>
            )}
          </>
        ) : null}
      </div>
  );
};

export default FooterActions;
