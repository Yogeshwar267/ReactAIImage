import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  Folder,
  Monitor,
  SwitchCamera,
  CircleX,
  RotateCcw,
} from "lucide-react";
import "./App.css";
import {
  AI_MODEL_TYPE,
  API_URL,
  negativeprompt,
  prompts,
} from "./shared/constants";
import { SOUND_FILES } from "./shared/sounds";
import useSound from "use-sound";
import PromptSlider from "./components/PromptSlider";
const API_CONFIG = {
  STABLE_DIFFUSION_ENDPOINT: "YOUR_API_ENDPOINT_HERE",
  API_KEY: "YOUR_API_KEY_HERE",
};

const colorSchemes = {
  blue: {
    primary: "blue",
    accent: "cyan",
    text: "blue-400",
    glow: "blue-500",
    bg: "blue-950",
  },
  green: {
    primary: "green",
    accent: "emerald",
    text: "green-400",
    glow: "green-500",
    bg: "green-950",
  },
  red: {
    primary: "red",
    accent: "rose",
    text: "red-400",
    glow: "red-500",
    bg: "red-950",
  },
};

//temp
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#000",
    color: "#fff",
    height: "100vh",
    justifyContent: "center",
    zIndex: 1,
  },
  video: {
    border: "2px solid #00ff00",
    borderRadius: "8px",
    marginBottom: "20px",
    width: "100%",
    maxWidth: "100vw",
    height: "100vh",
  },
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    backgroundColor: "#00ff00",
    color: "#000",
    fontWeight: "bold",
    marginBottom: "20px",
  },
  snapshotContainer: {
    marginTop: "20px",
    textAlign: "center",
  },
  snapshot: {
    border: "2px solid #00ff00",
    borderRadius: "8px",
    maxWidth: "80%",
    height: "auto",
  },
  canvas: {
    display: "none", // Canvas is hidden as it's only used for capturing the frame
  },
};

function base64ToBlob(base64, contentType = "", sliceSize = 512) {
  const byteCharacters = atob(base64.split(",")[1]); // Remove the data URI prefix
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
}

const MilitaryCameraInterface = () => {
  const [time, setTime] = useState(new Date());
  const [status, setStatus] = useState("STANDBY");
  const [zoom] = useState(1.0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [colorScheme, setColorScheme] = useState("green");
  const [bootSequence, setBootSequence] = useState(true);
  const colors = colorSchemes[colorScheme];
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [snapshot, setSnapshot] = useState(null);
  const [stream, setStream] = useState(null);
  const fileInputRef = useRef(null);
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [outputImage, setOutputImage] = useState(null);
  const [resonseId, setResponseId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isBasicMode, setIsBasicMode] = useState(true);

  const [playButtonPress, { stopButtonPress }] = useSound(
    SOUND_FILES.buttonPress
  );
  const [playCameraPress] = useSound(SOUND_FILES.cameraPress);
  const [playStartup] = useSound(SOUND_FILES.startup);

  useEffect(() => {
    if (!bootSequence) {
      playStartup();
    }
  }, [bootSequence]);

  // Handler function for toggle change
  const handleToggle = () => {
    setIsBasicMode((prevState) => !prevState);
  };

  const [locationError, setLocationError] = useState(null);
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const resetState = () => {
    playButtonPress();
    setError(null); // Clear error
    setSnapshot(null); // Clear snapshot
    setSelectedPrompt(""); // Clear prompt
    setOutputImage(null); // Clear output image
    setLoading(false); // Reset loading state
    setImageError(""); // Clear image error
  };

  useEffect(() => {
    // Simulate boot sequence
    setTimeout(() => setBootSequence(false), 3000);
  }, []);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setError(null); // Clear any previous errors
        },
        (err) => {
          setLocationError(err.message);
          setLocation({ latitude: null, longitude: null });
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  const generateImage = async () => {
    playCameraPress();
    capturePhoto();
  };

  // Function to start the camera stream
  const startCameraStream = async (retries = 3) => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints = {
        video: isFrontCamera
          ? { facingMode: "user" }
          : { facingMode: { exact: "environment" } },
        audio: false,
      };

      const userMediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      setStream(userMediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = userMediaStream;
        videoRef.current.play();
      }
    } catch (error) {
      let errorMessage = "An error occurred while accessing the camera.";
      if (error.name === "NotAllowedError") {
        errorMessage =
          "Camera access was denied. Please check your browser permissions.";
      } else if (error.name === "NotFoundError") {
        errorMessage = "No camera found on this device.";
      } else if (error.name === "NotReadableError") {
        errorMessage = "The camera is already in use by another application.";
        if (retries > 0) {
          setTimeout(() => startCameraStream(retries - 1), 2000); // Retry after 2 seconds
        }
      }

      console.error(errorMessage, error);
      setError(errorMessage);
    }
  };

  // Function to capture the current video frame
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && stream) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext("2d");

      // Set the canvas size to match the video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current video frame onto the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get the image as a data URL
      const imageDataUrl = canvas.toDataURL("image/png");
      setSnapshot(imageDataUrl);
    }
  };

  // Trigger file input click
  const openFilePicker = () => {
    playButtonPress();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result;
        setSnapshot(base64);
        console.log("Base64 Image:", base64);
        // Use the Base64 string as needed (e.g., display or upload)
      };
      reader.readAsDataURL(file); // Convert to Base64
    }
  };

  const handlePromptChange = (e) => {
    setSelectedPrompt(e.target.value);
    outputImage?.length ? setOutputImage(null) : null;
    handleSubmitRequest(e.target.value);
  };

  const handleGoBack = () => {
    resetState();
    setSnapshot("");
    playButtonPress();
  };

  const handleDownload = () => {
    playButtonPress();

    // Create a link and trigger the download
    const link = document.createElement("a");
    link.href = outputImage;
    link.download = "image.jpg"; // File name
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    playButtonPress();
    if (navigator.share) {
      try {
        // Fetch the blob from the blob URL
        const response = await fetch(outputImage);
        const blob = await response.blob();

        // Create a file from the blob
        const file = new File([blob], "image.jpg", { type: blob.type });

        // Share the file
        await navigator.share({
          title: "Shared Image",
          text: selectedPrompt || "Check out this image!",
          files: [file], // Share the file directly
        });

        alert("Image shared successfully!");
      } catch (error) {
        console.error("Error sharing:", error);
        alert("Unable to share the image.");
      }
    } else {
      alert("Sharing is not supported in this browser.");
    }
  };

  const handleSubmitRequest = async (prompt) => {
    setLoading(true);

    const contentType = "image/png"; // Specify the MIME type
    const imageBlob = base64ToBlob(snapshot, contentType);

    const formData = new FormData();
    formData.append("prompt", prompt || selectedPrompt);
    formData.append("image", imageBlob);
    formData.append("negative_prompt", negativeprompt);
    formData.append("cgf_scale", 4.5);
    formData.append("controlnet_type", "depth");
    formData.append("controlnet_weight", 0.55);
    formData.append(
      "model_name",
      isBasicMode ? AI_MODEL_TYPE.HQ : AI_MODEL_TYPE.TURBO
    );

    try {
      const response = await fetch(`${API_URL}generate-image-from-external`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        const requestId = data?.request_id;
        if (requestId) {
          pollStatus(requestId); // Start polling
        } else {
          throw new Error("Request ID is missing from the response");
        }
      } else {
        setLoading(false);
        setImageError(response.statusText);
      }
    } catch (error) {
      setLoading(false);
      setImageError("Something went wrong. Please retry");
    }
  };

  const pollStatus = async (requestId) => {
    const pollInterval = 5000; // 5 seconds
    const maxRetries = isBasicMode ? 50 : 200; // Adjust based on timeout needs
    let retries = 0;

    const checkStatus = async () => {
      try {
        const response = await fetch(`${API_URL}check-status/${requestId}`);

        const contentType = response.headers.get("Content-Type");

        if (contentType.includes("application/json")) {
          const data = await response.json();

          if (data.status === "processing") {
            console.log("Image is still processing...");
            if (retries < maxRetries) {
              retries++;
              setTimeout(checkStatus, pollInterval);
            } else {
              setLoading(false);
              setImageError("Image generation timed out. Please retry.");
            }
          } else {
            throw new Error("Unexpected status in JSON response");
          }
        } else if (contentType.includes("image/png")) {
          // Image is ready, read it as a blob
          const imageBlob = await response.blob();
          const imageUrl = URL.createObjectURL(imageBlob); // Create a temporary URL for the image
          console.log("Image generated successfully:", imageUrl);
          setOutputImage(imageUrl); // Update your state with the generated image URL
          setLoading(false);
        } else {
          throw new Error("Unexpected Content-Type");
        }
      } catch (error) {
        console.error("Error while checking status:", error);
        setLoading(false);
        setImageError("Something went wrong. Please retry.");
      }
    };

    checkStatus(); // Start the first check
  };

  // Start the camera stream when the component mounts
  useEffect(() => {
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
    }

    startCameraStream();
    getLocation();

    return () => {
      // Clean up the stream when the component unmounts
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [videoRef.current, isFrontCamera]);

  if (bootSequence) {
    return (
      <div
        className={`w-full h-screen bg-black font-mono text-${colors.text} p-8`}
      >
        <div className="animate-typing">
          MILITARY GRADE IMAGING SYSTEM v1.0.0
          <br />
          Copyright (c) 2024 Classified Operations
          <br />
          <br />
          Initializing system components...
          <br />
          Loading kernel modules... OK
          <br />
          Checking memory... 64MB OK
          <br />
          Loading display drivers... OK
          <br />
          Initializing neural network... OK
          <br />
          <br />
          READY TO PROCEED...
        </div>
      </div>
    );
  }

  return (
    <>
      {loading ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center flex-col">
          <div className="text-white text-lg">Please wait...</div>
          <button
            className={` mt-4 px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all`}
            onClick={() => {
              setLoading(false);
              handleGoBack();
            }}
          >
            Cancel
          </button>
        </div>
      ) : null}
      <div
        className={`relative w-full h-screen bg-gradient-to-br from-${colors.bg} via-black to-${colors.bg} overflow-hidden font-mono`}
      >
        {/* Glassmorphic background elements */}
        <div className="absolute inset-0">
          <div
            className={`absolute top-1/4 left-1/4 w-96 h-96 bg-${colors.primary}-500/10 rounded-full filter blur-3xl`}
          />
          <div
            className={`absolute bottom-1/3 right-1/3 w-64 h-64 bg-${colors.accent}-500/10 rounded-full filter blur-3xl`}
          />
        </div>

        {/* DOS-style scan lines */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_2px,rgba(0,0,0,0.1)_2px)] bg-[length:4px_4px] pointer-events-none" />

        {/* Main viewport */}
        <div
          className={`absolute inset-0 bg-gradient-to-b from-${colors.primary}-900/40 to-transparent z-10`}
        >
          {/* Color scheme switcher */}
          {!outputImage?.length && !snapshot ? (
            <div className="absolute top-14 right-4 flex space-x-2 z-50 right-0 left-0 w-max mx-auto justify-center bg-black/40 p-4 rounded-lg">
              
              {Object.keys(colorSchemes).map((scheme) => {
                return (
                  <button
                    key={scheme}
                    onClick={() => {
                      setColorScheme(scheme);
                      playButtonPress();
                    }}
                    className={`p-2 rounded-lg backdrop-blur-md border transition-all relative group overflow-hidden
                ${
                  colorScheme === scheme
                    ? `bg-${scheme}-900/50 border-${scheme}-400/50`
                    : `bg-${scheme}-900/20 border-${scheme}-400/20`
                }`}
                  >
                    <Monitor
                      className={`w-4 h-4 text-${scheme}-400 group-hover:scale-150 transition-transform`}
                    />
                  </button>
                );
              })}
            </div>
          ) : null}

          {/* DOS-style header */}
          <div
            className={`absolute top-0 left-0 right-0 bg-black text-${colors.text} p-1 font-mono text-sm`}
          >
            C:\MILITARY\IMAGING> process.exe -secure -neural
          </div>

          {/* Grid overlay */}
          <div
            className={`absolute inset-0 bg-[linear-gradient(0deg,transparent_24px,rgba(0,255,255,0.05)_25px),linear-gradient(90deg,transparent_24px,rgba(0,255,255,0.05)_25px)] bg-[length:25px_25px]`}
          />

          {/* Enhanced targeting reticle
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className={`w-32 h-32 border border-${colors.text}/30 rounded-full animate-pulse backdrop-blur-md bg-${colors.primary}-500/5`}
          />
          <div
            className={`absolute top-1/2 left-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 border border-${colors.text}/50 rounded-full backdrop-blur-md bg-${colors.primary}-500/10`}
          />
          <div
            className={`absolute top-1/2 left-1/2 w-1 h-16 -translate-x-1/2 -translate-y-1/2 bg-${colors.text}/30 backdrop-blur-sm`}
          />
          <div
            className={`absolute top-1/2 left-1/2 w-16 h-1 -translate-x-1/2 -translate-y-1/2 bg-${colors.text}/30 backdrop-blur-sm`}
          />
        </div> */}

          {/* Top HUD */}
          <div className="absolute top-10 left-0 right-0 p-4 font-mono text-sm flex justify-between items-start">
            <div className="space-y-2">
              <div
                className={`backdrop-blur-md p-4 rounded-md border border-${colors.text}/20 shadow-lg shadow-${colors.glow}/20 border-r`}
                style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
              >
                <div className={`text-${colors.text}`}>█ SYSTEM STATUS</div>
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between">
                    <span className={`text-${colors.text}/70`}>LAT:</span>
                    <span className={`text-${colors.text}`}>
                      {location.latitude}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-${colors.text}/70`}>LONG:</span>
                    <span className={`text-${colors.text}`}>
                      {location.longitude}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-${colors.text}/70`}>STATUS:</span>
                    <span className={`text-${colors.text}`}>{status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-${colors.text}/70`}>ZOOM:</span>
                    <span className={`text-${colors.text}`}>{zoom}x</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2.5 items-center">
              <div
                className={`backdrop-blur-md p-4 min-w-28 rounded-md border border-${colors.text}/20 shadow-lg shadow-${colors.glow}/20`}
                style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
              >
                {time.toLocaleTimeString()}
              </div>
              {snapshot ? (
                <div className="flex-col gap-5 justify-items-end">
                  <button
                    className={`right-0 p-2 rounded-lg backdrop-blur-md border transition-all relative group overflow-hidden
                  ${colorScheme === colorScheme
                        ? `bg-${colorScheme}-900/50 border-${colorScheme}-400/50`
                        : `bg-${colorScheme}-900/20 border-${colorScheme}-400/20`
                      } transition-all duration-300 
              border border-${colors.text}/20 hover:border-${colors.text}/50
              shadow-lg shadow-${colors.glow}/20`}
                      style={{
                        height: "40px",
                        width: "40px",
                      }}
                      onClick={handleGoBack}
                    >
                      <RotateCcw
                        className={`w-6 h-6 group-hover:scale-110 transition-transform`}
                      />
                    </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-96">
              {error}
              {/* <Alert variant="destructive" className={`border-${colors.primary}-500/50 bg-${colors.bg}/20 backdrop-blur-md`}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className={`text-${colors.text}`}>
                {error}
              </AlertDescription>
            </Alert> */}
            </div>
          )}

          {/* Bottom controls */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            {/* <div className="my-5 flex justify-center">
              <label class="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={isBasicMode}
                  onChange={handleToggle}
                  class="peer sr-only"
                />
                <div
                  class={`peer flex h-8 items-center gap-4 rounded-full bg-${colorScheme}-600 px-3 after:absolute after:left-1 after: after:h-6 after:w-16 after:rounded-full after:bg-white/40 after:transition-all after:content-[''] peer-checked:bg-stone-600 peer-checked:after:translate-x-full peer-focus:outline-none dark:border-slate-600 dark:bg-slate-700 text-sm text-white`}
                >
                  <span>HQ</span>
                  <span>Turbo</span>
                </div>
              </label>
            </div> */}
            {/* testing div */}
            {snapshot ? (
              <div className="container">
                <div className={`switches-container ${colorScheme ? `bg-${colorScheme}-600` : "bg-gray-600"}`}>
                  <input
                    type="radio"
                    id="switchMonthly"
                    name="switchPlan"
                    value="Monthly"
                    defaultChecked={true} // Default selected state
                  />
                  <input
                    type="radio"
                    id="switchYearly"
                    name="switchPlan"
                    value="Yearly"
                  />
                  <label htmlFor="switchMonthly">HQ</label>
                  <label htmlFor="switchYearly">Turbo</label>
                  <div className="switch-wrapper">
                    <div className="switch">
                      <div>HQ</div>
                      <div>Turbo</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            {/* testing div */}
            <div className="flex justify-center items-center space-x-8">
              {!snapshot ? (
                <>
                  {" "}
                  <button
                    onClick={generateImage}
                    disabled={isProcessing}
                    className={`
              relative group overflow-hidden
              bg-${colors.primary}-900/10 hover:bg-${colors.primary
                      }-800/20 text-${colors.text} p-6 
              rounded-xl backdrop-blur-md transition-all duration-300 
              border border-${colors.text}/20 hover:border-${colors.text}/50
              shadow-lg shadow-${colors.glow}/20
              ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
            `}
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
                  >
                    <Camera
                      className={`w-8 h-8 group-hover:scale-110 transition-transform ${isProcessing ? "animate-pulse" : ""
                        }`}
                    />
                  </button>
                  <button
                    onClick={openFilePicker}
                    className={`
            relative group overflow-hidden
            bg-${colors.primary}-900/10 hover:bg-${colors.primary}-800/20 text-${colors.text} p-6 
            rounded-xl backdrop-blur-md transition-all duration-300 
            border border-${colors.text}/20 hover:border-${colors.text}/50
            shadow-lg shadow-${colors.glow}/20
          `}
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-r from-${colors.primary}-500/10 to-${colors.accent}-500/10 opacity-0 group-hover:opacity-100 transition-opacity`}
                    />
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
                  ) ? (
                    <button
                      onClick={() => {
                        playButtonPress();
                        setIsFrontCamera((prev) => !prev);
                      }}
                      disabled={isProcessing}
                      className={`
              relative group overflow-hidden
              bg-${colors.primary}-900/10 hover:bg-${colors.primary
                        }-800/20 text-${colors.text} p-6 
              rounded-xl backdrop-blur-md transition-all duration-300 
              border border-${colors.text}/20 hover:border-${colors.text}/50
              shadow-lg shadow-${colors.glow}/20
              ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
            `}
                      style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
                    >
                      <SwitchCamera
                        className={`w-8 h-8 group-hover:scale-110 transition-transform ${isProcessing ? "animate-pulse" : ""
                          }`}
                      />
                    </button>
                  ) : null}
                </>
              ) : outputImage?.length ? (
                <div
                  className="mt-10"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginRight: "20px",
                    marginLeft: "20px",
                    alignItems: "center",
                    gap: "20px",
                  }}
                >
                  <button
                    className={`
                btn px-6 py-3 h-12 text-lg font-semibold rounded-lg transition-all duration-300
                bg-${colorScheme}-600 text-white
                hover:bg-${colorScheme}-700
                focus:outline-none focus:ring-4 focus:ring-${colorScheme}-500
                disabled:bg-gray-400 disabled:cursor-not-allowed
                w-32
              `}
                    onClick={handleShare}
                    disabled={!outputImage}
                  >
                    Share
                  </button>
                  <button
                    className={`
                btn px-6 py-3 h-12 text-lg font-semibold rounded-lg transition-all duration-300
                bg-${colorScheme}-600 text-white
                hover:bg-${colorScheme}-700
                focus:outline-none focus:ring-4 focus:ring-${colorScheme}-500
                disabled:bg-gray-400 disabled:cursor-not-allowed
                 w-32
              `}
                    onClick={handleDownload}
                    disabled={!outputImage}
                  >
                    Download
                  </button>
                  <button
                    className={`
               btn px-6 py-3 h-12 text-lg font-semibold rounded-lg transition-all duration-300
               bg-${colorScheme}-600 text-white
               hover:bg-${colorScheme}-700
               focus:outline-none focus:ring-4 focus:ring-${colorScheme}-500
               disabled:bg-gray-400 disabled:cursor-not-allowed
             `}
                    onClick={resetState}
                  >
                    Recapture
                  </button>
                </div>
              ) : (
                <>
                  {/* {prompts.map((prompt, index) => (
                  <button
                    className={`backdrop-blur-md p-4 min-w-28 rounded-md border border-2 border-${
                      colors.text
                    }/10 shadow-lg shadow-${colors.glow}/20 mt-12  ${
                      selectedPrompt === prompt
                        ? `text-${colors.text} border-${colors.text}/30`
                        : `border-${colors.inactiveText}/20`
                    } hover:border-${colorScheme}-900 hover:bg-${colorScheme}-200 hover:scale-110 transition-transform`}
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
                    onClick={() => {
                      playButtonPress();
                      handlePromptChange({ target: { value: prompt } });
                      stopButtonPress();
                    }}
                  >
                    {prompt}
                  </button>
                ))} */}
                  <PromptSlider
                    colorScheme={colorScheme}
                    colors={colors}
                    handlePromptChange={handlePromptChange}
                    playButtonPress={playButtonPress}
                    prompts={prompts}
                    selectedPrompt={selectedPrompt}
                    stopButtonPress={stopButtonPress}
                  />
                </>
              )}
            </div>
          </div>

          {/* Corner brackets */}
          <div
            className={`absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-${colors.text}/30 `}
          />
          <div
            className={`absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-${colors.text}/30`}
          />
          <div
            className={`absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-${colors.text}/30`}
          />
          <div
            className={`absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-${colors.text}/30`}
          />

          {/* Scanning line effect */}
          {!snapshot ? (
            <div
              className={`absolute top-0 left-0 right-0 backdrop-blur-sm animate-scan scanning-line bg-${colorScheme} border-${colorScheme}`}
              style={{
                borderColor: colorScheme, // Set border color dynamically
              }}
            />
          ) : null}
        </div>
        <div style={styles.container}>
          <div
            className="absolute"
            style={{
              backgroundColor: colorScheme,
              width: "100%",
              maxWidth: "100vw",
              height: "100vh",
              opacity: 0.2,
            }}
          />
          {snapshot ? (
            <img
              src={outputImage?.length ? outputImage : snapshot}
              className="image rounded-md"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`rounded-lg w-full max-w-full h-screen 
            bg-gradient-to-br from-${colorScheme}-500 to-black`}
            ></video>
          )}
          <canvas ref={canvasRef} style={styles.canvas}></canvas>
        </div>
      </div>
    </>
  );
};

// Add custom animations
const style = document.createElement("style");
style.textContent = `
  @keyframes scan {
    from { transform: translateY(0); }
    to { transform: translateY(100vh); }
  }
  @keyframes load {
    from { transform: translateY(-20vh); }
    to { transform: translateY(20vh); }
  }
  .animate-scan {
    animation: scan 2s linear infinite;
  }
  
  .animate-loading {
    animation: load 3s linear infinite;
  }
    .scanning-line {
    box-sizing: content-box; /* Or border-box if required */
    border-width: 1px; /* Define a specific width */
    border-style: solid; /* Ensure the style is solid */
}
    .line {
  height: 10px; /* Make it thicker for better visibility */
  width: 100%;  /* Full width */
}

  
  @keyframes typing {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .animate-typing > * {
    animation: typing 0.1s steps(1) infinite;
  }
`;
document.head.appendChild(style);

export default MilitaryCameraInterface;
