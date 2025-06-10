import React from 'react'
import { create } from 'react-test-renderer'
import linkify from './linkify'

describe('linkify', () => {
  it('converts URLs to anchor tags', () => {
    const input = 'Visit https://example.com and http://test.com for more info.'
    const tree = create(<>{linkify(input)}</>)
    const anchors = tree.root.findAllByType('a')
    expect(anchors[0].props.href).toBe('https://example.com')
    expect(anchors[1].props.href).toBe('http://test.com')
  })
})