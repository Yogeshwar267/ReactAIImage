import React, { useState, useCallback } from "react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import Slider from "react-slick";
import classNames from "classnames";

const PromptSlider = ({
  prompts,
  selectedPrompt,
  handlePromptChange,
  playButtonPress,
  stopButtonPress,
  colors,
  colorScheme,
  disabled,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleButtonClick = useCallback(
    (prompt) => {
      playButtonPress();
      handlePromptChange({ target: { value: prompt } });
      stopButtonPress();
    },
    [handlePromptChange, playButtonPress, stopButtonPress]
  );

  const settings = {
    dots: true,
    infinite: false,
    speed: 500,
    arrows: false,
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
    <Slider {...settings}>
      {prompts?.length > 0 &&
        prompts.map((prompt, index) => (
          <div key={index} className="flex-shrink-0">
            <button
              disabled={disabled}
              className={classNames(
                `backdrop-blur-md rounded-lg border border-2 border-${colors.text}/10 h-12 w-12 shadow-lg shadow-${colors.glow}/20 justify-items-center flex items-center`,
                {
                  [`text-${colors.text} border-${colors.text}/30`]:
                    selectedPrompt === prompt,
                  [`border-${colors.inactiveText}/20`]:
                    selectedPrompt !== prompt,
                  [disabled ? '' : `hover:border-${colorScheme}-900 hover:text-${colors.text}`]: true,
                }
              )}
              // style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
              onClick={() => handleButtonClick(prompt)}
              aria-label={`Select prompt ${index + 1}`}
            >
              <div
                className={classNames(
                  `h-12 w-12 ${disabled ? '' :'hover:scale-125'} content-center hover:text-${colorScheme}`
                )}
              >
                {index + 1}
              </div>
            </button>
          </div>
        ))}
    </Slider>
  );
};

export default React.memo(PromptSlider);
