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
    `px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
      isActive 
        ? 'bg-blue-600 text-white shadow-lg' 
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
    }`

  return (
    <div className={`border border-gray-600 rounded-lg overflow-hidden ${className}`}>
      {/* 툴바 */}
      <div className="bg-gray-800 border-b border-gray-600 p-3">
        <div className="flex flex-wrap gap-2">
          {/* 텍스트 서식 */}
          <div className="flex gap-1 border-r border-gray-600 pr-3 mr-3">
            <button
              type="button"
              onClick={() => formatText('bold')}
              className={getButtonClass()}
              title="굵게"
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              onClick={() => formatText('italic')}
              className={getButtonClass()}
              title="기울임"
            >
              <em>I</em>
            </button>
            <button
              type="button"
              onClick={() => formatText('underline')}
              className={getButtonClass()}
              title="밑줄"
            >
              <u>U</u>
            </button>
            <button
              type="button"
              onClick={() => formatText('strikeThrough')}
              className={getButtonClass()}
              title="취소선"
            >
              <s>S</s>
            </button>
          </div>

          {/* 글씨 크기 */}
          <div className="flex gap-1 border-r border-gray-600 pr-3 mr-3">
            <button
              type="button"
              onClick={() => formatText('fontSize', '3')}
              className={getButtonClass()}
              title="큰 글씨"
            >
              <span className="text-lg">A</span>
            </button>
            <button
              type="button"
              onClick={() => formatText('fontSize', '2')}
              className={getButtonClass()}
              title="중간 글씨"
            >
              <span>A</span>
            </button>
            <button
              type="button"
              onClick={() => formatText('fontSize', '1')}
              className={getButtonClass()}
              title="작은 글씨"
            >
              <span className="text-xs">A</span>
            </button>
          </div>

          {/* 정렬 */}
          <div className="flex gap-1 border-r border-gray-600 pr-3 mr-3">
            <button
              type="button"
              onClick={() => formatText('justifyLeft')}
              className={getButtonClass()}
              title="왼쪽 정렬"
            >
              ⬅️
            </button>
            <button
              type="button"
              onClick={() => formatText('justifyCenter')}
              className={getButtonClass()}
              title="가운데 정렬"
            >
              ↔️
            </button>
            <button
              type="button"
              onClick={() => formatText('justifyRight')}
              className={getButtonClass()}
              title="오른쪽 정렬"
            >
              ➡️
            </button>
          </div>

          {/* 리스트 */}
          <div className="flex gap-1 border-r border-gray-600 pr-3 mr-3">
            <button
              type="button"
              onClick={() => insertList('unordered')}
              className={getButtonClass()}
              title="순서 없는 목록"
            >
              • 목록
            </button>
            <button
              type="button"
              onClick={() => insertList('ordered')}
              className={getButtonClass()}
              title="순서 있는 목록"
            >
              1. 목록
            </button>
          </div>

          {/* 링크 */}
          <button
            type="button"
            onClick={insertLink}
            className={getButtonClass()}
            title="링크 삽입"
          >
            🔗 링크
          </button>

          {/* 미리보기 토글 */}
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className={getButtonClass(isPreview)}
            title="미리보기"
          >
            👁️ 미리보기
          </button>
        </div>
      </div>

      {/* 에디터 영역 */}
      <div className="bg-gray-900">
        {isPreview ? (
          <div 
            className="p-4 min-h-[200px] prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: value }}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            className="p-4 min-h-[200px] focus:outline-none"
            style={{ 
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
            dangerouslySetInnerHTML={{ __html: value }}
            suppressContentEditableWarning={true}
          />
        )}
        
        {!value && !isPreview && (
          <div className="absolute top-4 left-4 text-gray-500 pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>

      {/* 도움말 */}
      <div className="bg-gray-800 px-4 py-2 text-xs text-gray-400 border-t border-gray-600">
        💡 <strong>사용법:</strong> 텍스트를 선택하고 서식 버튼을 클릭하거나, 단축키를 사용하세요 (Ctrl+B: 굵게, Ctrl+I: 기울임)
      </div>
    </div>
  )
}
