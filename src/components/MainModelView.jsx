import React, { useRef, useEffect } from "react";

function MainModelView({
  snapshot,
  outputImage,
  colorScheme = "green",
  videoRef,
  loading,
  cameraButtons,
}) {
  const imageSrc = outputImage?.length ? outputImage : snapshot;

  return (
    <>
      <div className="absolute bottom-0 left-0 right-0 p-4 pr-0 flex items-center justify-center w-max mx-auto" style={{zIndex:99}}>
        {cameraButtons()}
      </div>
      <div className="flex justify-center items-center">
        {!snapshot ? (
          <div
            className={`absolute top-0 left-0 right-0 backdrop-blur-sm animate-scan scanning-line bg-${colorScheme} border-${colorScheme}`}
            style={{
              borderColor: colorScheme, // Set border color dynamically
            }}
          />
        ) : null}
        {snapshot ? (
          // Render Image if snapshot exists
          <img
            src={imageSrc}
            alt="Media"
            className="rounded-md w-full max-w-full h-screen"
            //   style={{ maxWidth: "100%", maxHeight: "100%" }}
          />
        ) : (
          // Render Video if snapshot is not available
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`rounded-lg w-full max-w-full h-screen bg-gradient-to-br from-${colorScheme}-500 to-black`}
            muted // Optional: Mute video if it's autoplayed
          />
        )}
      </div>
    </>
  );
}

export default MainModelView;
