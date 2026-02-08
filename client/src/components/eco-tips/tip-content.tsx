import React from 'react';

type TipContentProps = {
  content: string;
};

/**
 * Renders eco-tip content with special formatting for "Did you know?" sections and DIY projects
 */
export const TipContent: React.FC<TipContentProps> = ({ content }) => {
  // Simple check if the content has our special formatting
  const hasSpecialFormatting = content.includes("**Did you know?**") || content.includes("**DIY Project:**");
  
  if (!hasSpecialFormatting) {
    // Plain text, no special formatting
    return <p className="text-sm text-gray-700 break-words">{content}</p>;
  }
  
  // Split the content into paragraphs and format each one
  return (
    <>
      {content.split('\n\n').map((paragraph, idx) => {
        if (paragraph.startsWith('**Did you know?**')) {
          return (
            <div key={idx} className="mt-3 p-2 bg-blue-50 rounded-md border border-blue-100">
              <p className="text-sm text-blue-800 font-medium">
                💡 Did you know?
              </p>
              <p className="text-sm text-blue-700">
                {paragraph.replace('**Did you know?**', '').trim()}
              </p>
            </div>
          );
        } else if (paragraph.startsWith('**DIY Project:**')) {
          return (
            <div key={idx} className="mt-3 p-2 bg-green-50 rounded-md border border-green-100">
              <p className="text-sm text-green-800 font-medium">
                🛠️ DIY Project
              </p>
              <p className="text-sm text-green-700">
                {paragraph.replace('**DIY Project:**', '').trim()}
              </p>
            </div>
          );
        } else {
          return (
            <p key={idx} className="text-sm text-gray-700 mb-2">
              {paragraph}
            </p>
          );
        }
      })}
    </>
  );
};

export default TipContent;