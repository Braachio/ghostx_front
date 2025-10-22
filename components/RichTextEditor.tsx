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
  const [fontSize, setFontSize] = useState('12')
  const [fontFamily, setFontFamily] = useState('맑은 고딕')
  const [textColor, setTextColor] = useState('#000000')
  const [editorHeight, setEditorHeight] = useState(200)
  const editorRef = useRef<HTMLDivElement>(null)

  const execCommand = (command: string, value?: string) => {
    if (!editorRef.current) return
    
    editorRef.current.focus()
    
    try {
      const success = document.execCommand(command, false, value)
      if (!success) {
        console.warn('Command failed:', command)
      }
    } catch (error) {
      console.warn('Command execution failed:', command, error)
    }
    
    // 포커스 유지
    setTimeout(() => {
      editorRef.current?.focus()
    }, 10)
  }

  const changeFontSize = (size: string) => {
    setFontSize(size)
    execCommand('fontSize', size)
  }

  const changeFontFamily = (family: string) => {
    setFontFamily(family)
    execCommand('fontName', family)
  }

  const changeTextColor = (color: string) => {
    setTextColor(color)
    execCommand('foreColor', color)
  }

  const insertTable = () => {
    const tableHtml = `
      <table border="1" style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="padding: 4px;">&nbsp;</td>
          <td style="padding: 4px;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding: 4px;">&nbsp;</td>
          <td style="padding: 4px;">&nbsp;</td>
        </tr>
      </table>
    `
    execCommand('insertHTML', tableHtml)
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

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML
      onChange(content)
    }
  }

  const formatText = (command: string, value?: string) => {
    execCommand(command, value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 엔터 키 처리 개선
    if (e.key === 'Enter') {
      e.preventDefault()
      // 단순한 줄바꿈
      execCommand('insertHTML', '<br>')
    }
  }


  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg ${className}`}>
      {/* 다크모드 툴바 */}
      <div className="bg-gray-800 border-b border-gray-700 p-2 flex items-center gap-2 flex-wrap">
        {/* 폰트 선택 */}
        <select 
          value={fontFamily} 
          onChange={(e) => changeFontFamily(e.target.value)}
          className="px-2 py-1 text-xs border border-gray-600 rounded bg-gray-700 text-white"
        >
          <option value="맑은 고딕">맑은 고딕</option>
          <option value="굴림">굴림</option>
          <option value="돋움">돋움</option>
          <option value="바탕">바탕</option>
          <option value="궁서">궁서</option>
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
        </select>

        {/* 폰트 크기 */}
        <select 
          value={fontSize} 
          onChange={(e) => changeFontSize(e.target.value)}
          className="px-2 py-1 text-xs border border-gray-600 rounded bg-gray-700 text-white"
        >
          <option value="8">8</option>
          <option value="9">9</option>
          <option value="10">10</option>
          <option value="11">11</option>
          <option value="12">12</option>
          <option value="14">14</option>
          <option value="16">16</option>
          <option value="18">18</option>
          <option value="20">20</option>
          <option value="24">24</option>
          <option value="28">28</option>
          <option value="32">32</option>
        </select>

        {/* 텍스트 서식 버튼들 */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => formatText('bold')}
            className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 text-white font-bold"
            title="굵게"
          >
            가
          </button>
          <button
            type="button"
            onClick={() => formatText('italic')}
            className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 text-white italic"
            title="기울임"
          >
            가
          </button>
          <button
            type="button"
            onClick={() => formatText('underline')}
            className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 text-white underline"
            title="밑줄"
          >
            가
          </button>
          <button
            type="button"
            onClick={() => formatText('strikeThrough')}
            className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 text-white line-through"
            title="취소선"
          >
            가
          </button>
        </div>

        {/* 색상 선택 */}
        <div className="flex items-center gap-1">
          <input
            type="color"
            value={textColor}
            onChange={(e) => changeTextColor(e.target.value)}
            className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
            title="글자 색상"
          />
          <button
            type="button"
            onClick={() => changeTextColor('#ffffff')}
            className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 text-white"
            title="기본 색상"
          >
            가
          </button>
        </div>

        {/* 테이블 */}
        <button
          type="button"
          onClick={insertTable}
          className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 text-white"
          title="표 삽입"
        >
          ⊞
        </button>

        {/* 리스트 */}
        <button
          type="button"
          onClick={() => insertList('unordered')}
          className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 text-white"
          title="순서 없는 목록"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => insertList('ordered')}
          className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 text-white"
          title="순서 있는 목록"
        >
          1.
        </button>

        {/* 정렬 */}
        <button
          type="button"
          onClick={() => formatText('justifyLeft')}
          className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 text-white"
          title="왼쪽 정렬"
        >
          ⬅
        </button>

        {/* 실행 취소/다시 실행 */}
        <button
          type="button"
          onClick={() => execCommand('undo')}
          className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 text-white"
          title="실행 취소"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={() => execCommand('redo')}
          className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 text-white"
          title="다시 실행"
        >
          ↷
        </button>

        {/* 링크 */}
        <button
          type="button"
          onClick={insertLink}
          className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 text-white"
          title="링크 삽입"
        >
          🔗
        </button>
      </div>

      {/* 에디터 영역 */}
      <div className="relative bg-gray-900">
        {isPreview ? (
          <div 
            className="p-4 min-h-[200px] border border-gray-700 text-white"
            style={{ minHeight: `${editorHeight}px` }}
            dangerouslySetInnerHTML={{ __html: value }}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            className="p-4 focus:outline-none text-white leading-normal"
            style={{ 
              minHeight: `${editorHeight}px`,
              fontSize: `${fontSize}px`,
              fontFamily: fontFamily,
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
          <div className="absolute top-4 left-4 text-gray-500 pointer-events-none text-sm">
            {placeholder}
          </div>
        )}
      </div>

      {/* 하단 크기 조절 바 */}
      <div className="bg-gray-800 border-t border-gray-700 p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-300">크기:</span>
          <input
            type="range"
            min="150"
            max="500"
            value={editorHeight}
            onChange={(e) => setEditorHeight(Number(e.target.value))}
            className="w-20"
          />
          <span className="text-xs text-gray-300">{editorHeight}px</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className={`px-3 py-1 text-xs rounded ${
              isPreview 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 border border-gray-600 hover:bg-gray-600 text-white'
            }`}
          >
            {isPreview ? '편집' : '미리보기'}
          </button>
        </div>
      </div>
    </div>
  )
}
