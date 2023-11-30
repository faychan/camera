import { Box } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";

const style = {
  width: "100%" /* Container takes full width */,
  maxWidth: "660px",
  maxHeight: "388px",
  overflow: "hidden" /* Prevents overflow */,
  videoStyle: {
    width: "100%" /* Container takes full width */,
    height: "auto",
  },
  container: {
    display: "flex",
    flexFlow: "column",
    padding: "20px",
    gap: "1rem",
  },
};

const streamConfig = {
  width: { min: 1280, ideal: 1920 },
  height: { min: 720, ideal: 1080 },
  facingMode: "environment",
  frameRate: { ideal: 30 },
  focusMode: "continuous", // This is not standardized and may not work on all browsers/devices
  advanced: [{ focusMode: "manual", focusDistance: 0.5 }],
};

const App = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [imageSrc, setImageSrc] = useState("");
  const [videoSize, setVideoSize] = useState({});

  useEffect(() => {
    startCamera();
  }, []);

  // Start the camera stream
  const startCamera = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          video: streamConfig,
        })
        .then((stream) => {
          videoRef.current.srcObject = stream;
          // Once the stream is playing, we can access the dimensions
          videoRef.current.onloadedmetadata = () => {
            setVideoSize({
              height: videoRef.current.offsetHeight + "px",
              width: videoRef.current.offsetWidth + "px",
            });
          };
        })
        .catch((error) => {
          console.error("hehe error", error);
        });
    } else if (
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia
    ) {
      // Older browsers with prefixed versions
      const getUserMedia = (
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia
      ).bind(navigator);
      getUserMedia(
        {
          video: streamConfig,
        },
        (stream) => {
          videoRef.current.srcObject = stream;
          // Once the stream is playing, we can access the dimensions
          videoRef.current.onloadedmetadata = () => {
            setVideoSize({
              height: videoRef.current.offsetHeight + "px",
              width: videoRef.current.offsetWidth + "px",
            });
          };
        },
        (error) => {
          console.error("hehe error", error);
        }
      );
    }
  };

  // Function to recursively reduce the image size
  const compressImage = (canvas, context, quality, callback) => {
    // Convert the canvas to a JPEG blob
    canvas.toBlob(
      (blob) => {
        let size = blob.size / 1024 / 1024; // Convert size to MB
        if (size < 2) {
          // If the size is less than 2MB, call the callback with the blob
          callback(blob);
        } else if (quality > 0.1) {
          // If the size is still above 2MB, and quality is above the threshold, reduce quality
          compressImage(canvas, context, quality - 0.1, callback); // Recursive call with reduced quality
        } else {
          // If we've reached the quality threshold and size is still too big, stop trying
          alert(
            "Unable to reduce image size to below 2 MB because quality is already too low"
          );
        }
      },
      "image/jpeg", // Use JPEG format
      quality // Current quality level
    );
  };

  // Capture the image and start the compression process
  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    // Set canvas size to match video size to avoid scaling issues
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current frame from the video onto the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Start the compression with the highest quality (1)
    compressImage(canvas, context, 1, (blob) => {
      // Use the blob here, e.g., create an object URL and set it as the src of an image element
      setImageSrc(URL.createObjectURL(blob));
    });
  };

  useEffect(() => {
    // // Handler to call on window resize
    const handleResize = () => {
      const { offsetWidth: refWidth, offsetHeight: refHeight } =
        videoRef.current;
      if (videoRef) {
        const newSize = {
          width: refWidth + "px",
          height: refHeight + "px",
        };
        setVideoSize(newSize);
      }
    };

    // // Add event listener for resize
    window.addEventListener("resize", handleResize);

    // // Invoke the handler initially to set the correct state
    handleResize();

    // // Remove event listener on cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <Box sx={style.container}>
      <Box sx={style}>
        <video
          style={style.videoStyle}
          ref={videoRef}
          autoPlay
          playsInline
        ></video>
      </Box>
      <button onClick={captureImage}>Capture Image</button>
      <canvas
        ref={canvasRef}
        height={videoSize.height}
        width={videoSize.width}
        style={{ display: "none" }}
      ></canvas>
      {imageSrc && (
        <img
          src={imageSrc}
          height={videoSize.height}
          width={videoSize.width}
          alt="Captured"
        />
      )}
    </Box>
  );
};

export default App;
