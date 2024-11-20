import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  Folder,
  AlertCircle,
  Monitor,
  SwitchCamera,
  CircleArrowLeft,
  RotateCcw,
  CrossIcon,
  Cross,
  CircleX,
} from "lucide-react";
// import { Alert, AlertDescription } from '@/components/ui/alert';
import "./App.css";
import PromptSelection from "./components/PromptSelection";
import { negativeprompt, prompts } from "./shared/constants";
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
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isTurboMode, setIsTurboMode] = useState(false);

  const [playButtonPress, { stopButtonPress }] = useSound(
    SOUND_FILES.buttonPress
  );
  const [playCameraPress, { stopCameraPress }] = useSound(
    SOUND_FILES.cameraPress
  );
  const [playStartup, { stopStartup }] = useSound(SOUND_FILES.startup);

  useEffect(() => {
    if (!bootSequence) {
      playStartup();
    }
    // setTimeout(()=> {
    //   stopStartup();
    // },5000)
  }, [bootSequence]);

  // Handler function for toggle change
  const handleToggle = () => {
    setIsTurboMode((prevState) => !prevState);
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
    stopButtonPress();
    stopStartup();
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

    return;
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      setStatus("PROCESSING");
      setError(null);

      const requestConfig = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_CONFIG.API_KEY}`,
        },
        body: JSON.stringify({
          prompt: "your_prompt_here",
          negative_prompt: "your_negative_prompt_here",
          steps: 20,
          width: 512,
          height: 512,
          guidance_scale: 7.5,
        }),
      };

      const response = await fetch(
        API_CONFIG.STABLE_DIFFUSION_ENDPOINT,
        requestConfig
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      setGeneratedImages((prevImages) => [...prevImages, data.image]);
      setStatus("STANDBY");
    } catch (err) {
      setError(err.message);
      setStatus("ERROR");
    } finally {
      setIsProcessing(false);
    }
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
    stopCameraPress();
    stopStartup();
  };

  // Trigger file input click
  const openFilePicker = () => {
    playButtonPress();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
    stopButtonPress();
    stopStartup();
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
    handleSubmit(e.target.value);
  };

  console.log(selectedPrompt, "text SELECTED PROMT");

  const handleGoBack = () => {
    resetState();
    setSnapshot("");
    playButtonPress();
    setTimeout(() => {
      stopButtonPress();
    }, 3000);
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
    stopButtonPress();
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
    stopButtonPress();
  };

  const handleSubmit = async (prompt) => {
    setLoading(true);
    const contentType = "image/png"; // Specify the MIME type
    const imageBlob = base64ToBlob(snapshot, contentType);

    const formData = new FormData();
    formData.append("prompt", prompt || selectedPrompt); // Ensure selectedPrompt is defined
    formData.append("image", imageBlob); // Ensure snapshot is a valid file object
    formData.append("negative_prompt", negativeprompt); // Ensure snapshot is a valid file object
    formData.append("cgf_scale", 4.5); // Ensure snapshot is a valid file object
    formData.append("controlnet_type", "depth"); // Ensure snapshot is a valid file object
    formData.append("controlnet_weight", 0.55); // Ensure snapshot is a valid file object

    try {
      const response = await fetch("http://3.210.112.3:5002/generate-image", {
        method: "POST",
        body: formData,
      });

      if (response.ok && response.body) {
        // Handle the readable stream from the response
        const reader = response.body.getReader();
        const chunks = [];
        let done = false;

        while (!done) {
          const { value, done: streamDone } = await reader.read();
          if (value) chunks.push(value);
          done = streamDone;
        }

        // Combine chunks into a single Blob
        const blob = new Blob(chunks);

        // Create an Object URL for the Blob
        const imageUrl = URL.createObjectURL(blob);
        setLoading(false);
        setOutputImage(imageUrl);
        // Display the image (example: dynamically add an image element)
        // const imgElement = document.createElement("img");
        // imgElement.src = imageUrl;
        // imgElement.alt = "Generated Image";
        // document.body.appendChild(imgElement); // Append to the DOM
      } else {
        setLoading(false);
        setImageError(response.statusText);
        console.error("Error generating image:", response.statusText);
      }
    } catch (error) {
      setLoading(false);
      setImageError("Something went wrong. Please retry");
    }
  };

  const textClass = `text-${colorScheme}-100`;

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

  // if (snapshot) {
  //   return (
  //     <div>
  //       <div
  //         className="mt-5 ml-5"
  //         style={{
  //           height: "20px",
  //           width: "20px",
  //         }}
  //         onClick={handleGoBack}
  //       >
  //         <CircleArrowLeft className={`w-8 h-8`} />
  //       </div>
  //       <div className="justify-between p-4 items-end">
  //         <PromptSelection
  //           handleSelectChange={handlePromptChange}
  //           colorScheme={colorScheme}
  //         />
  //       </div>
  //       <div
  //         className="mt-6"
  //         style={{
  //           display: "flex",
  //           justifyContent: "space-between",
  //           marginRight: "20px",
  //           marginLeft: "20px",
  //           alignItems: "center",
  //         }}
  //       >
  //         <div
  //           className={`imageContainer rounded-md border border-${colors.text}/20 shadow-lg shadow-${colors.glow}/20 bg-gradient-to-br from-${colorScheme}-500 to-black`}
  //         >
  //           <img src={snapshot} className="image rounded-md" />
  //         </div>
  //         <button
  //           className={`
  //   btn px-6 py-3 h-12 text-lg font-semibold rounded-lg transition-all duration-300
  //   bg-${colorScheme}-600 text-white
  //   hover:bg-${colorScheme}-700
  //   focus:outline-none focus:ring-4 focus:ring-${colorScheme}-500
  //   disabled:bg-gray-400 disabled:cursor-not-allowed
  // `}
  //           onClick={handleSubmit}
  //           disabled={!selectedPrompt}
  //         >
  //           Transform
  //         </button>
  //         <div
  //           className={`imageContainer rounded-md border border-${colors.text}/20 shadow-lg shadow-${colors.glow}/20 bg-gradient-to-br from-${colorScheme}-500 to-black`}
  //         >
  //           {outputImage?.length ? (
  //             <img src={outputImage} className="image rounded-md" />
  //           ) : null}
  //           {imageError?.length ? (
  //             <h2 className={textClass}>{imageError}</h2>
  //           ) : null}
  //           {loading ? (
  //             <div
  //               className={`flex w-full animate-loading scanning-line`}
  //               style={{
  //                 borderColor: colorScheme, // Set border color dynamically
  //               }}
  //             />
  //           ) : null}
  //         </div>
  //       </div>

  //       <div
  //         className="mt-10"
  //         style={{
  //           display: "flex",
  //           justifyContent: "center",
  //           marginRight: "20px",
  //           marginLeft: "20px",
  //           alignItems: "center",
  //           gap: "20px",
  //         }}
  //       >
  //         <button
  //           className={`
  //   btn px-6 py-3 h-12 text-lg font-semibold rounded-lg transition-all duration-300
  //   bg-${colorScheme}-600 text-white
  //   hover:bg-${colorScheme}-700
  //   focus:outline-none focus:ring-4 focus:ring-${colorScheme}-500
  //   disabled:bg-gray-400 disabled:cursor-not-allowed
  //   w-32
  // `}
  //           onClick={handleShare}
  //           disabled={!outputImage}
  //         >
  //           Share
  //         </button>
  //         <button
  //           className={`
  //   btn px-6 py-3 h-12 text-lg font-semibold rounded-lg transition-all duration-300
  //   bg-${colorScheme}-600 text-white
  //   hover:bg-${colorScheme}-700
  //   focus:outline-none focus:ring-4 focus:ring-${colorScheme}-500
  //   disabled:bg-gray-400 disabled:cursor-not-allowed
  //    w-32
  // `}
  //           onClick={handleDownload}
  //           disabled={!outputImage}
  //         >
  //           Download
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

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
          <div className="absolute top-14 right-4 flex space-x-2 z-50">
            {/* <button
            className={`p-2 rounded-lg backdrop-blur-md border transition-all
               `}
            onClick={() => setIsFrontCamera((prev) => !prev)}
          >
            <SwitchCamera className={`w-4 h-4`} />
          </button> */}
            {Object.keys(colorSchemes).map((scheme) => {
              return (
                <button
                  key={scheme}
                  onClick={() => {
                    setColorScheme(scheme);
                    playButtonPress();
                    setTimeout(() => {
                      stopButtonPress();
                    }, 3000);
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
            <div className="flex-row justify-items-end">
              <div
                className={`backdrop-blur-md p-4 min-w-28 rounded-md border border-${colors.text}/20 shadow-lg shadow-${colors.glow}/20 mt-12`}
                style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
              >
                {time.toLocaleTimeString()}
              </div>
              {snapshot ? (
                <div className="flex-col gap-5 justify-items-end">
                  <div className="my-5">
                    <label class="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={isTurboMode}
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
                  </div>
                  <button
                    className={`right-0 mr-2 p-2 rounded-lg backdrop-blur-md border transition-all relative group overflow-hidden
                  ${
                    colorScheme === colorScheme
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
                    <CircleX
                      className={`w-6 h-6 group-hover:scale-110 transition-transform`}
                    />
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96">
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
          <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center items-center space-x-8">
            {!snapshot ? (
              <>
                {" "}
                <button
                  onClick={generateImage}
                  disabled={isProcessing}
                  className={`
              relative group overflow-hidden
              bg-${colors.primary}-900/10 hover:bg-${
                    colors.primary
                  }-800/20 text-${colors.text} p-6 
              rounded-xl backdrop-blur-md transition-all duration-300 
              border border-${colors.text}/20 hover:border-${colors.text}/50
              shadow-lg shadow-${colors.glow}/20
              ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
            `}
                  style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
                >
                  <Camera
                    className={`w-8 h-8 group-hover:scale-110 transition-transform ${
                      isProcessing ? "animate-pulse" : ""
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
                      stopButtonPress();
                    }}
                    disabled={isProcessing}
                    className={`
              relative group overflow-hidden
              bg-${colors.primary}-900/10 hover:bg-${
                      colors.primary
                    }-800/20 text-${colors.text} p-6 
              rounded-xl backdrop-blur-md transition-all duration-300 
              border border-${colors.text}/20 hover:border-${colors.text}/50
              shadow-lg shadow-${colors.glow}/20
              ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
            `}
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
                  >
                    <SwitchCamera
                      className={`w-8 h-8 group-hover:scale-110 transition-transform ${
                        isProcessing ? "animate-pulse" : ""
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

              // style={{
              //   border: `2px solid ${colorScheme}`,
              //   borderRadius: "8px",
              //   marginBottom: "20px",
              //   width: "100%",
              //   maxWidth: "100vw",
              //   height: "100vh",
              //   backgroundImage: `linear-gradient(145deg, ${colorScheme}, ${"black"})`,
              // }}
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
