/**
 * @fileoverview Highlighted Transcription - Shows transcription with highlighted errors
 * @module components/homework/HighlightedTranscription
 */

/**
 * Highlights errors in transcription text
 * @param {string} transcription - The full transcription text
 * @param {Array} corrections - Array of corrections with 'original' field
 * @returns {JSX.Element} Highlighted transcription
 */
export default function HighlightedTranscription({ transcription, corrections }) {
  if (!transcription) return null;
  if (!corrections || corrections.length === 0) {
    return (
      <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
        {transcription}
      </p>
    );
  }

  // Get all error words from corrections
  const errorWords = corrections
    .map(corr => corr.original?.trim())
    .filter(Boolean);

  // Function to escape special regex characters
  const escapeRegex = (str) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Split transcription into segments (text + highlighted errors)
  const highlightText = () => {
    if (errorWords.length === 0) return transcription;

    // Create regex pattern that matches any error word (case insensitive)
    const pattern = errorWords
      .map(word => escapeRegex(word))
      .join('|');

    const regex = new RegExp(`(${pattern})`, 'gi');

    // Split text by error words, keeping the delimiters
    const parts = transcription.split(regex);

    return parts.map((part, index) => {
      // Check if this part is an error word
      const isError = errorWords.some(word =>
        part.toLowerCase() === word.toLowerCase()
      );

      if (isError) {
        return (
          <mark
            key={index}
            className="bg-red-200 dark:bg-red-900/40 text-red-900 dark:text-red-200 px-1 rounded"
            title="Error identificado"
          >
            {part}
          </mark>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  return (
    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
      {highlightText()}
    </p>
  );
}
