import { JSX } from 'react'

export default function linkify(text: string): JSX.Element[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)

  return parts.map((part, index) =>
    urlRegex.test(part) ? (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline break-all dark:text-blue-400"
      >
        {part}
      </a>
    ) : (
      <span key={index}>{part}</span>
    )
  )
}