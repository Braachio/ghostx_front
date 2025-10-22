'use client'

import { useState, useRef } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "설명을 입력하세요...", 
  className = "" 
}: RichTextEditorProps) {
  const [isPreview, setIsPreview] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

  const insertLink = () => {
    const url = prompt('링크 URL을 입력하세요:')
    if (url) {
      execCommand('createLink', url)
    }
  }

  const insertList = (type: 'ordered' | 'unordered') => {
    execCommand(type === 'ordered' ? 'insertOrderedList' : 'insertUnorderedList')
  }

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const formatText = (command: string) => {
    execCommand(command)
  }

  const getButtonClass = (isActive?: boolean) => 
    `relative px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 group ${
      isActive 
        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30' 
        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600 hover:text-white hover:shadow-md'
    }`

  return (
    <div className={`relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-gray-700/50 rounded-xl overflow-hidden shadow-xl backdrop-blur-sm ${className}`}>
      {/* 툴바 */}
      <div className="bg-gradient-to-r from-gray-800/90 to-gray-700/90 border-b border-gray-600/50 p-4 backdrop-blur-sm">
        <div className="flex flex-wrap gap-3">
          {/* 텍스트 서식 */}
          <div className="flex gap-1 border-r border-gray-600/50 pr-4 mr-4">
            <button
              type="button"
              onClick={() => formatText('bold')}
              className={getButtonClass()}
              title="굵게 (Ctrl+B)"
            >
              <span className="font-bold">B</span>
            </button>
            <button
              type="button"
              onClick={() => formatText('italic')}
              className={getButtonClass()}
              title="기울임 (Ctrl+I)"
            >
              <span className="italic">I</span>
            </button>
            <button
              type="button"
              onClick={() => formatText('underline')}
              className={getButtonClass()}
              title="밑줄 (Ctrl+U)"
            >
              <span className="underline">U</span>
            </button>
            <button
              type="button"
              onClick={() => formatText('strikeThrough')}
              className={getButtonClass()}
              title="취소선"
            >
              <span className="line-through">S</span>
            </button>
          </div>

          {/* 글씨 크기 */}
          <div className="flex gap-1 border-r border-gray-600/50 pr-4 mr-4">
            <button
              type="button"
              onClick={() => formatText('fontSize', '3')}
              className={getButtonClass()}
              title="큰 글씨"
            >
              <span className="text-lg font-bold">A</span>
            </button>
            <button
              type="button"
              onClick={() => formatText('fontSize', '2')}
              className={getButtonClass()}
              title="중간 글씨"
            >
              <span className="font-bold">A</span>
            </button>
            <button
              type="button"
              onClick={() => formatText('fontSize', '1')}
              className={getButtonClass()}
              title="작은 글씨"
            >
              <span className="text-xs font-bold">A</span>
            </button>
          </div>

          {/* 정렬 */}
          <div className="flex gap-1 border-r border-gray-600/50 pr-4 mr-4">
            <button
              type="button"
              onClick={() => formatText('justifyLeft')}
              className={getButtonClass()}
              title="왼쪽 정렬"
            >
              <span className="text-lg">⬅️</span>
            </button>
            <button
              type="button"
              onClick={() => formatText('justifyCenter')}
              className={getButtonClass()}
              title="가운데 정렬"
            >
              <span className="text-lg">↔️</span>
            </button>
            <button
              type="button"
              onClick={() => formatText('justifyRight')}
              className={getButtonClass()}
              title="오른쪽 정렬"
            >
              <span className="text-lg">➡️</span>
            </button>
          </div>

          {/* 리스트 */}
          <div className="flex gap-1 border-r border-gray-600/50 pr-4 mr-4">
            <button
              type="button"
              onClick={() => insertList('unordered')}
              className={getButtonClass()}
              title="순서 없는 목록"
            >
              <span className="text-lg">•</span>
              <span className="ml-1 text-xs">목록</span>
            </button>
            <button
              type="button"
              onClick={() => insertList('ordered')}
              className={getButtonClass()}
              title="순서 있는 목록"
            >
              <span className="text-lg">1.</span>
              <span className="ml-1 text-xs">목록</span>
            </button>
          </div>

          {/* 링크 */}
          <button
            type="button"
            onClick={insertLink}
            className={getButtonClass()}
            title="링크 삽입"
          >
            <span className="text-lg">🔗</span>
            <span className="ml-1 text-xs">링크</span>
          </button>

          {/* 미리보기 토글 */}
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className={getButtonClass(isPreview)}
            title="미리보기"
          >
            <span className="text-lg">👁️</span>
            <span className="ml-1 text-xs">미리보기</span>
          </button>
        </div>
      </div>

      {/* 에디터 영역 */}
      <div className="relative bg-gradient-to-br from-gray-900/50 to-black/50">
        {isPreview ? (
          <div 
            className="p-6 min-h-[200px] prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: value }}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            className="p-6 min-h-[200px] focus:outline-none text-gray-200 leading-relaxed"
            style={{ 
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
            dangerouslySetInnerHTML={{ __html: value }}
            suppressContentEditableWarning={true}
          />
        )}
        
        {!value && !isPreview && (
          <div className="absolute top-6 left-6 text-gray-500 pointer-events-none text-sm">
            {placeholder}
          </div>
        )}
      </div>

      {/* 도움말 */}
      <div className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 px-6 py-3 text-xs text-gray-400 border-t border-gray-600/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400">💡</span>
          <span><strong>사용법:</strong> 텍스트를 선택하고 서식 버튼을 클릭하거나, 단축키를 사용하세요</span>
          <span className="text-gray-500">•</span>
          <span className="text-blue-400">Ctrl+B: 굵게</span>
          <span className="text-gray-500">•</span>
          <span className="text-blue-400">Ctrl+I: 기울임</span>
          <span className="text-gray-500">•</span>
          <span className="text-blue-400">Ctrl+U: 밑줄</span>
        </div>
      </div>
    </div>
  )
}
