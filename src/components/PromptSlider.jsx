import React, { useState } from "react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import Slider from "react-slick";

const PromptSlider = ({
  prompts,
  selectedPrompt,
  handlePromptChange,
  playButtonPress,
  stopButtonPress,
  colors,
  colorScheme,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  var settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 4,
    initialSlide: 0,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
          infinite: true,
          dots: true,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
          initialSlide: 2,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <div className="relative w-full">
      {/* Slider container */}

      <Slider {...settings} >
        {prompts?.length
          ? prompts.map((prompt, index) => (
              <div key={index} className="flex-shrink-0 w-full">
                <button
                  className={`backdrop-blur-md w-full p-5 rounded-md border border-2 min-h-28 w-96 border-${
                    colors.text
                  }/10 shadow-lg shadow-${colors.glow}/20  ${
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
              </div>
            ))
          : null}
      </Slider>
    </div>
  );
};

export default PromptSlider;
