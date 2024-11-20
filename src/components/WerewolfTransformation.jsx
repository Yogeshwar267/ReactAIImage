// src/components/WerewolfTransformation.js
import React, { useState } from 'react';

const WerewolfTransformation = ({ image, prompt }) => {
  const [transformedImage, setTransformedImage] = useState(null);

  const applyTransformation = () => {
    // Simulate the transformation logic (you'd actually call an API here)
    setTimeout(() => {
      setTransformedImage(image); // Replace with the API call result
    }, 2000); // Simulate the processing delay
  };

  return (
    <div className="transformation">
      <h2>Transformation: {prompt}</h2>
      <button onClick={applyTransformation}>Apply Transformation</button>
      {transformedImage ? (
        <div>
          <img src={transformedImage} alt="Transformed Werewolf" className="transformed-image" />
          <div className="actions">
            <button>Download</button>
            <button>Share on Social Media</button>
          </div>
        </div>
      ) : (
        <p>Waiting for transformation...</p>
      )}
    </div>
  );
};

export default WerewolfTransformation;
