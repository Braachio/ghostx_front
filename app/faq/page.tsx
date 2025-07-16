'use client'

import { Disclosure } from '@headlessui/react'
import { ChevronUpIcon } from 'lucide-react'

const faqs = [
  {
    question: '분석 결과가 이상해요. 왜 그런가요?',
    answer: '분석은 업로드된 CSV 데이터에 따라 달라집니다. 일부 데이터가 누락되었거나 센서 오류가 있는 경우 결과가 왜곡될 수 있어요.',
  },
  {
    question: '지원하는 게임은 무엇인가요?',
    answer: '현재는 iRacing, ACC, 그란투리스모7 등을 지원하며, CSV 형식이 일치하면 대부분 분석 가능합니다.',
  },
  {
    question: '결과를 다른 사람과 공유할 수 있나요?',
    answer: '분석 결과 페이지의 URL을 복사해서 공유할 수 있습니다. 단, 일부는 유료 또는 로그인한 사용자만 열람할 수 있습니다.',
  },
]

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">❓ 자주 묻는 질문</h1>
      <div className="space-y-2">
        {faqs.map((faq, index) => (
          <Disclosure key={index}>
            {({ open }) => (
              <>
                <Disclosure.Button className="flex justify-between w-full bg-gray-100 dark:bg-gray-800 px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                  <span>{faq.question}</span>
                  <ChevronUpIcon className={`h-5 w-5 transition-transform ${open ? 'rotate-180' : 'rotate-0'}`} />
                </Disclosure.Button>
                <Disclosure.Panel className="px-4 pt-2 pb-2 text-sm text-gray-700 dark:text-gray-300">
                  {faq.answer}
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        ))}
      </div>
    </div>
  )
}
