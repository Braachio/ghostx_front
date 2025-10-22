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
    if (!editorRef.current) return
    
    editorRef.current.focus()
    
    // 선택 영역이 없으면 커서 위치에 선택 영역 생성
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      const range = document.createRange()
      range.selectNodeContents(editorRef.current)
      range.collapse(false) // 끝으로 이동
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
    
    try {
      document.execCommand(command, false, value)
    } catch (error) {
      console.warn('Command execution failed:', command, error)
    }
    
    // 포커스 유지
    setTimeout(() => {
      editorRef.current?.focus()
    }, 10)
  }

  const insertLink = () => {
    const url = prompt('링크 URL을 입력하세요:')
    if (url) {
      execCommand('createLink', url)
    }
  }

  const insertList = (type: 'ordered' | 'unordered') => {
    // 현재 선택된 텍스트가 있는지 확인
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const selectedText = range.toString()
      
      if (selectedText.trim()) {
        // 선택된 텍스트가 있으면 리스트로 변환
        execCommand(type === 'ordered' ? 'insertOrderedList' : 'insertUnorderedList')
      } else {
        // 선택된 텍스트가 없으면 새 리스트 항목 생성
        const listItem = type === 'ordered' ? '<ol><li></li></ol>' : '<ul><li></li></ul>'
        execCommand('insertHTML', listItem)
      }
    } else {
      // 선택이 없으면 새 리스트 항목 생성
      const listItem = type === 'ordered' ? '<ol><li></li></ol>' : '<ul><li></li></ul>'
      execCommand('insertHTML', listItem)
    }
  }

  const handleInput = (e: React.FormEvent) => {
    e.preventDefault()
    if (editorRef.current) {
      const content = editorRef.current.innerHTML
      // 중복 입력 방지를 위한 디바운싱
      setTimeout(() => {
        onChange(content)
      }, 10)
    }
  }

  const formatText = (command: string, value?: string) => {
    execCommand(command, value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 엔터 키 처리 개선
    if (e.key === 'Enter') {
      e.preventDefault()
      // 단순한 줄바꿈 대신 div 요소 사용
      execCommand('insertHTML', '<div></div>')
    }
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
              onClick={() => {
                const selection = window.getSelection()
                if (selection && selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0)
                  const selectedText = range.toString()
                  if (selectedText.trim()) {
                    execCommand('insertHTML', `<span style="font-size: 1.5em;">${selectedText}</span>`)
                  } else {
                    execCommand('insertHTML', '<span style="font-size: 1.5em;">큰 글씨</span>')
                  }
                }
              }}
              className={getButtonClass()}
              title="큰 글씨"
            >
              <span className="text-lg font-bold">A</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const selection = window.getSelection()
                if (selection && selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0)
                  const selectedText = range.toString()
                  if (selectedText.trim()) {
                    execCommand('insertHTML', `<span style="font-size: 1.2em;">${selectedText}</span>`)
                  } else {
                    execCommand('insertHTML', '<span style="font-size: 1.2em;">중간 글씨</span>')
                  }
                }
              }}
              className={getButtonClass()}
              title="중간 글씨"
            >
              <span className="font-bold">A</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const selection = window.getSelection()
                if (selection && selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0)
                  const selectedText = range.toString()
                  if (selectedText.trim()) {
                    execCommand('insertHTML', `<span style="font-size: 0.8em;">${selectedText}</span>`)
                  } else {
                    execCommand('insertHTML', '<span style="font-size: 0.8em;">작은 글씨</span>')
                  }
                }
              }}
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
            onKeyDown={handleKeyDown}
            className="p-6 min-h-[200px] focus:outline-none text-gray-200 leading-relaxed"
            style={{ 
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              direction: 'ltr',
              textAlign: 'left',
              unicodeBidi: 'normal'
            }}
            dir="ltr"
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


    </div>
  )
}
