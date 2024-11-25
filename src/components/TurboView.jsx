import React, { useEffect, useCallback, useMemo } from "react";
import { turboImageSize } from "../shared/constants";
import useDebounce from "../shared/hooks/useDebounce";
import { ImageMinus, SwitchCamera } from "lucide-react";

function TurboView({
  colorScheme = "blue",
  colors = { text: "white", glow: "blue" },
  snapshot,
  outputImage,
  imageError,
  loading,
  textClass = "text-white",
  videoRef,
  cameraButtons,
  selectedPrompt = "",
  changePrompt = () => {},
  handleSubmitRequest = () => {},
  resetState = () => {},
}) {
  // Debouncing the selectedPrompt input to reduce rerenders
  const debouncedPrompt = useDebounce(selectedPrompt, 500);

  useEffect(() => {
    if (debouncedPrompt && snapshot) {
      handleSubmitRequest(debouncedPrompt); // Call only when debounced prompt changes
    }
  }, [debouncedPrompt, snapshot]);

  // Memoize the dynamic styles to prevent recalculating them on every render
  const imageContainerStyle = useMemo(
    () => ({
      height: `${turboImageSize}vh`,
      width: `${turboImageSize}vw`,
    }),
    []
  );

  const imageOverlayStyle = useMemo(
    () => ({
      backgroundColor: colorScheme,
      height: `${turboImageSize}vh`,
      width: `${turboImageSize}vw`,
      opacity: 0.2,
    }),
    [colorScheme]
  );

  const buttonClass = `relative group overflow-hidden
  bg-${colors.primary}-900/10 hover:bg-${colors.primary}-800/20 text-${colors.text} p-[15px]
  rounded-xl backdrop-blur-md transition-all duration-300 
  border border-${colors.text}/20 hover:border-${colors.text}/50
  shadow-lg shadow-${colors.glow}/20`;

  const iconClass = () => `w-8 h-8 group-hover:scale-110 transition-transform`;

  // Memoize the cameraButtons to avoid re-creating on each render
  const memoizedCameraButtons = useMemo(() => cameraButtons(), [cameraButtons]);

  // Memoize the text input's styles
  const inputClassNames = useMemo(
    () =>
      `backdrop-blur-md p-4 rounded-md border border-${colors.text}/20 shadow-lg shadow-${colors.glow}/20 bg-gradient-to-br from-${colorScheme}-500/80 to-black w-3/4 focus:bg-[rgba(250,250,250,0.1)]`,
    [colors.text, colors.glow, colorScheme]
  );

  return (
    <div className="z-50 border-2">
      <div className="flex">
        <div
          className={`imageContainer rounded-md border border-${colors.text}/20 shadow-lg shadow-${colors.glow}/20 bg-gradient-to-br from-${colorScheme}-500 to-black`}
          style={imageContainerStyle}
        >
          <div className="absolute" style={imageOverlayStyle} />
          {snapshot ? (
            <>
              <img src={snapshot} alt="Snapshot" className="image rounded-md" />
              <div className="absolute flex w-max mx-auto z-50">
                <button
                  onClick={resetState}
                  className={`${buttonClass}`}
                  style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
                >
                  <ImageMinus className={iconClass()} />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="absolute flex w-max mx-auto z-50">
                {memoizedCameraButtons}
              </div>
              <div className="imageContainer" style={imageContainerStyle}>
                <div
                  className={`absolute flex w-full animate-loading scanning-line scanning_width`}
                  style={{
                    borderColor: colorScheme,
                    width: `${turboImageSize - 0.5}vw`,
                  }}
                />
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className={`rounded-lg image rounded-md`}
                  muted
                />
              </div>
            </>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginRight: "20px",
            marginLeft: "20px",
            alignItems: "center",
          }}
        >
          <div className="absolute" style={imageOverlayStyle} />
          <div
            className={`imageContainer rounded-md border border-${colors.text}/20 shadow-lg shadow-${colors.glow}/20 bg-gradient-to-br from-${colorScheme}-500 to-black`}
            style={imageContainerStyle}
          >
            {loading ? (
              <div
                className="absolute bg-black bg-opacity-50 z-50 flex justify-center items-center flex-col"
                style={{
                  width: `${turboImageSize}vw`,
                  height: `${turboImageSize}vh`,
                }}
              >
                <div className="text-white text-lg">Please wait...</div>
              </div>
            ) : null}
            {outputImage?.length ? (
              <img
                src={outputImage}
                alt="Output"
                className="image rounded-md"
              />
            ) : null}
            {imageError?.length && !loading ? (
              <h2 className={textClass}>{imageError}</h2>
            ) : null}
            {loading ? (
              <div
                className={`absolute flex w-full animate-loading scanning-line scanning_width`}
                style={{
                  borderColor: colorScheme,
                }}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center mt-6  ">
        <textarea
          className={inputClassNames}
          type="text"
          placeholder="Enter prompt"
          rows={4}
          value={selectedPrompt}
          onChange={(e) => changePrompt(e.target.value)}
        />
      </div>
    </div>
  );
}

export default React.memo(TurboView);
