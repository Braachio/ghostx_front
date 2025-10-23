'use client'

import { useState, useRef, useEffect } from 'react'

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
  const [fontSize, setFontSize] = useState('16')
  const [fontFamily, setFontFamily] = useState('맑은 고딕')
  const [textColor, setTextColor] = useState('#ffffff')
  const [editorHeight, setEditorHeight] = useState(200)
  const editorRef = useRef<HTMLDivElement>(null)

  // 컴포넌트 마운트 시 텍스트 방향 강제 설정
  useEffect(() => {
    const forceTextDirection = () => {
      if (editorRef.current) {
        editorRef.current.style.setProperty('direction', 'ltr', 'important')
        editorRef.current.style.setProperty('text-align', 'left', 'important')
        editorRef.current.style.setProperty('unicode-bidi', 'normal', 'important')
        editorRef.current.style.setProperty('writing-mode', 'horizontal-tb', 'important')
        editorRef.current.style.setProperty('text-direction', 'ltr', 'important')
        
        // 모든 자식 요소에도 방향 강제 적용
        const allElements = editorRef.current.querySelectorAll('*')
        allElements.forEach((element: Element) => {
          const htmlElement = element as HTMLElement
          htmlElement.style.setProperty('direction', 'ltr', 'important')
          htmlElement.style.setProperty('text-align', 'left', 'important')
          htmlElement.style.setProperty('unicode-bidi', 'normal', 'important')
          htmlElement.style.setProperty('writing-mode', 'horizontal-tb', 'important')
          htmlElement.style.setProperty('text-direction', 'ltr', 'important')
        })
      }
    }

    // 초기 설정
    forceTextDirection()
    
    // 주기적으로 재설정 (브라우저가 스타일을 덮어쓸 수 있음)
    const interval = setInterval(forceTextDirection, 100)
    
    return () => clearInterval(interval)
  }, [])

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
    
    // 텍스트 방향 강제 설정
    if (editorRef.current) {
      editorRef.current.style.setProperty('direction', 'ltr', 'important')
      editorRef.current.style.setProperty('text-align', 'left', 'important')
      editorRef.current.style.setProperty('unicode-bidi', 'normal', 'important')
      editorRef.current.style.setProperty('writing-mode', 'horizontal-tb', 'important')
      editorRef.current.style.setProperty('text-direction', 'ltr', 'important')
      
      // 모든 자식 요소에도 방향 강제 적용
      const allElements = editorRef.current.querySelectorAll('*')
      allElements.forEach((element: Element) => {
        const htmlElement = element as HTMLElement
        htmlElement.style.setProperty('direction', 'ltr', 'important')
        htmlElement.style.setProperty('text-align', 'left', 'important')
        htmlElement.style.setProperty('unicode-bidi', 'normal', 'important')
        htmlElement.style.setProperty('writing-mode', 'horizontal-tb', 'important')
        htmlElement.style.setProperty('text-direction', 'ltr', 'important')
      })
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
      // 텍스트 방향 강제 설정
      editorRef.current.style.setProperty('direction', 'ltr', 'important')
      editorRef.current.style.setProperty('text-align', 'left', 'important')
      editorRef.current.style.setProperty('unicode-bidi', 'normal', 'important')
      editorRef.current.style.setProperty('writing-mode', 'horizontal-tb', 'important')
      editorRef.current.style.setProperty('text-direction', 'ltr', 'important')
      
      // 모든 자식 요소에도 방향 강제 적용
      const allElements = editorRef.current.querySelectorAll('*')
      allElements.forEach((element: Element) => {
        const htmlElement = element as HTMLElement
        htmlElement.style.setProperty('direction', 'ltr', 'important')
        htmlElement.style.setProperty('text-align', 'left', 'important')
        htmlElement.style.setProperty('unicode-bidi', 'normal', 'important')
        htmlElement.style.setProperty('writing-mode', 'horizontal-tb', 'important')
        htmlElement.style.setProperty('text-direction', 'ltr', 'important')
      })
      
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
      
      // execCommand를 사용한 간단한 줄바꿈 처리
      execCommand('insertHTML', '<br><br>')
      
      // 텍스트 방향 강제 설정
      if (editorRef.current) {
        editorRef.current.style.setProperty('direction', 'ltr', 'important')
        editorRef.current.style.setProperty('text-align', 'left', 'important')
        editorRef.current.style.setProperty('unicode-bidi', 'normal', 'important')
        editorRef.current.style.setProperty('writing-mode', 'horizontal-tb', 'important')
        editorRef.current.style.setProperty('text-direction', 'ltr', 'important')
      }
    }
  }


  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg shadow-lg ${className}`}>
      {/* 다크모드 툴바 */}
      <div className="bg-gray-800 border-b border-gray-700 p-3 flex items-center gap-3 flex-wrap">
        {/* 폰트 설정 그룹 */}
        <div className="flex items-center gap-2 border-r border-gray-600 pr-3">
          <select 
            value={fontFamily} 
            onChange={(e) => changeFontFamily(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-600 rounded-md bg-gray-700 text-white hover:bg-gray-600 transition-colors"
          >
            <option value="맑은 고딕">맑은 고딕</option>
            <option value="굴림">굴림</option>
            <option value="돋움">돋움</option>
            <option value="바탕">바탕</option>
            <option value="궁서">궁서</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
          </select>

          <select 
            value={fontSize} 
            onChange={(e) => changeFontSize(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-600 rounded-md bg-gray-700 text-white hover:bg-gray-600 transition-colors"
          >
            <option value="12">12px</option>
            <option value="14">14px</option>
            <option value="16">16px</option>
            <option value="18">18px</option>
            <option value="20">20px</option>
            <option value="22">22px</option>
            <option value="24">24px</option>
            <option value="28">28px</option>
            <option value="32">32px</option>
            <option value="36">36px</option>
            <option value="40">40px</option>
            <option value="48">48px</option>
          </select>
        </div>

        {/* 텍스트 서식 그룹 */}
        <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
          <button
            type="button"
            onClick={() => formatText('bold')}
            className="px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 text-white font-bold transition-colors"
            title="굵게"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => formatText('italic')}
            className="px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 text-white italic transition-colors"
            title="기울임"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => formatText('underline')}
            className="px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 text-white underline transition-colors"
            title="밑줄"
          >
            U
          </button>
          <button
            type="button"
            onClick={() => formatText('strikeThrough')}
            className="px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 text-white line-through transition-colors"
            title="취소선"
          >
            S
          </button>
        </div>

        {/* 색상 및 정렬 그룹 */}
        <div className="flex items-center gap-2 border-r border-gray-600 pr-3">
          <select
            value={textColor}
            onChange={(e) => changeTextColor(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-600 rounded-md bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            title="글자 색상"
          >
            <option value="#ffffff">⚪ 흰색</option>
            <option value="#ffff00">🟡 노란색</option>
            <option value="#00ff00">🟢 초록색</option>
            <option value="#00ffff">🔵 청록색</option>
            <option value="#ff00ff">🟣 자홍색</option>
            <option value="#ffa500">🟠 주황색</option>
            <option value="#ff6b6b">🔴 빨간색</option>
            <option value="#4ecdc4">🟢 민트색</option>
            <option value="#45b7d1">🔵 하늘색</option>
            <option value="#96ceb4">🟢 연두색</option>
            <option value="#feca57">🟡 황금색</option>
            <option value="#ff9ff3">🟣 핑크색</option>
          </select>

          <button
            type="button"
            onClick={() => formatText('justifyLeft')}
            className="px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 text-white transition-colors"
            title="왼쪽 정렬"
          >
            ⬅
          </button>
        </div>

        {/* 리스트 및 테이블 그룹 */}
        <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
          <button
            type="button"
            onClick={() => insertList('unordered')}
            className="px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 text-white transition-colors"
            title="순서 없는 목록"
          >
            •
          </button>
          <button
            type="button"
            onClick={() => insertList('ordered')}
            className="px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 text-white transition-colors"
            title="순서 있는 목록"
          >
            1.
          </button>
          <button
            type="button"
            onClick={insertTable}
            className="px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 text-white transition-colors"
            title="표 삽입"
          >
            ⊞
          </button>
        </div>

        {/* 실행 취소/다시 실행 그룹 */}
        <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
          <button
            type="button"
            onClick={() => execCommand('undo')}
            className="px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 text-white transition-colors"
            title="실행 취소"
          >
            ↶
          </button>
          <button
            type="button"
            onClick={() => execCommand('redo')}
            className="px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 text-white transition-colors"
            title="다시 실행"
          >
            ↷
          </button>
        </div>

        {/* 링크 그룹 */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={insertLink}
            className="px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 text-white transition-colors"
            title="링크 삽입"
          >
            🔗
          </button>
        </div>
      </div>

      {/* 에디터 영역 */}
      <div className="relative bg-gray-900 border-t border-gray-700">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className="p-6 focus:outline-none text-white leading-relaxed min-h-[200px]"
          style={{ 
            minHeight: `${editorHeight}px`,
            fontSize: `${fontSize}px`,
            fontFamily: fontFamily,
            direction: 'ltr !important',
            textAlign: 'left !important',
            unicodeBidi: 'normal !important',
            writingMode: 'horizontal-tb !important',
            textOrientation: 'mixed !important',
            textDirection: 'ltr !important'
          }}
          dir="ltr"
          suppressContentEditableWarning={true}
        />
        
        {!value && (
          <div className="absolute top-6 left-6 text-gray-500 pointer-events-none text-sm">
            {placeholder}
          </div>
        )}
      </div>

      {/* 하단 크기 조절 바 */}
      <div className="bg-gray-800 border-t border-gray-700 p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-300 font-medium">에디터 높이:</span>
          <input
            type="range"
            min="150"
            max="500"
            value={editorHeight}
            onChange={(e) => setEditorHeight(Number(e.target.value))}
            className="w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          />
          <span className="text-sm text-gray-300 font-mono bg-gray-700 px-2 py-1 rounded">
            {editorHeight}px
          </span>
        </div>
        
        <div className="text-xs text-gray-400">
          리치 텍스트 에디터
        </div>
      </div>
    </div>
  )
}
