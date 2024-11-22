// src/components/UploadImage.js
import React, { useState } from 'react';

const UploadImage = ({ onImageUpload }) => {
  const [image, setImage] = useState(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        onImageUpload(reader.result); // Send image to parent
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCaptureImage = (event) => {
    const capture = event.target.files[0];
    if (capture) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        onImageUpload(reader.result);
      };
      reader.readAsDataURL(capture);
    }
  };

  return (
    <div className="upload-container">
      <input type="file" onChange={handleImageUpload} accept="image/*" />
      <input
        type="file"
        accept="image/*"
        capture="camera"
        onChange={handleCaptureImage}
      />
      {image && <img src={image} alt="Uploaded" className="uploaded-image" />}
    </div>
  );
};

export default UploadImage;
