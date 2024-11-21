import React, { useCallback } from "react";
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
  const handleButtonClick = useCallback(
    (prompt) => {
      playButtonPress?.();
      handlePromptChange({ target: { value: prompt } });
      stopButtonPress?.();
    },
    [handlePromptChange, playButtonPress, stopButtonPress]
  );

  return (
    <div className="flex flex-wrap gap-2 custom-num-spacing">
      {prompts.map((prompt, index) => (
        <div key={index} className="flex-shrink-0">
          <button
            disabled={disabled}
            className={classNames(
              "backdrop-blur-md rounded-lg border h-8 w-8 shadow-lg flex items-center justify-center",
              {
                [`text-${colors.text} border-${colors.text}/30`]:
                  selectedPrompt === prompt,
                [`border-white/20`]:
                  selectedPrompt !== prompt,
                [`hover:border-${colorScheme}-900 hover:text-${colors.text}`]:
                  !disabled,
              }
            )}
            onClick={() => handleButtonClick(prompt)}
            aria-label={`Select prompt ${index + 1}`}
          >
            <div
              className={classNames(
                "h-8 w-8 flex items-center justify-center",
                { "hover:scale-125": !disabled }
              )}
            >
              {index + 1}
            </div>
          </button>
        </div>
      ))}
    </div>
  );
};

export default React.memo(PromptSlider);
