import React from 'react';

const prompts = [
  "Werewolf emerging in shadowy woods.",
  "Ferocious werewolf howling under a full moon.",
  "Transforming human-werewolf hybrid.",
  "Camouflaged werewolf in urban ruins.",
  "Humanoid Start Werewolf",
  "Mid-Transformation Werewolf",
  "Near-Full Werewolf",
  "Full Werewolf"
];

const PromptSelection = ({ handleSelectChange, colorScheme }) => {
  const bgClass = `bg-${colorScheme}-900`;
  const textClass = `text-${colorScheme}-100`;
  const borderClass = `border-${colorScheme}-700`;
  const hoverBgClass = `hover:bg-${colorScheme}-800`; // Darker shade for hover
  const focusBorderClass = `focus:border-${colorScheme}-500`; // Lighter shade for

  return (
    <div className="prompt-selection">
      <h2 className={textClass}>Select a Werewolf Transformation:</h2>
      <select
        className={`rounded-lg p-4 ${bgClass} ${textClass} ${borderClass} ${hoverBgClass} ${focusBorderClass}`}
        onChange={handleSelectChange}
      >
        <option value="" disabled selected>
          Choose an option
        </option>
        {prompts.map((prompt, index) => (
          <option key={index} value={prompt}>
            {prompt}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PromptSelection;
