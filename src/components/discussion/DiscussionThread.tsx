'use client'

import type { DiscussionPostNode } from '@/lib/discussion/tree'
import { useState } from 'react'
import ReplyForm from './ReplyForm'
import { MessageCircle } from 'lucide-react'

export default function DiscussionThread({
  nodes,
  topicId,
  onPosted,
  maxDepth = 8,
}: {
  nodes: DiscussionPostNode[]
  topicId: string
  onPosted: () => void
  maxDepth?: number
}) {
  return (
    <ul className="space-y-4 list-none pl-0">
      {nodes.map(node => (
        <ThreadNode
          key={node.id}
          node={node}
          topicId={topicId}
          depth={0}
          maxDepth={maxDepth}
          onPosted={onPosted}
        />
      ))}
    </ul>
  )
}

function ThreadNode({
  node,
  topicId,
  depth,
  maxDepth,
  onPosted,
}: {
  node: DiscussionPostNode
  topicId: string
  depth: number
  maxDepth: number
  onPosted: () => void
}) {
  const [replyOpen, setReplyOpen] = useState(false)
  const pad = Math.min(depth, maxDepth) * 16

  return (
    <li className="rounded-lg border border-gray-200 bg-white overflow-hidden" style={{ marginLeft: pad }}>
      <div className="px-3 py-2.5 sm:px-4 sm:py-3 border-b border-gray-100 bg-gray-50/80 flex flex-wrap items-center gap-2 text-xs text-gray-600">
        <span className="font-semibold text-gray-900">{node.author_label}</span>
        <span className="text-gray-300">·</span>
        <time dateTime={node.created_at}>
          {new Date(node.created_at).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </time>
      </div>
      <div
        className="px-3 py-3 sm:px-4 sm:py-4 prose prose-sm max-w-none text-gray-700 prose-p:my-2 prose-a:text-pink-600"
        dangerouslySetInnerHTML={{ __html: node.body }}
      />
      <div className="px-3 pb-3 sm:px-4 flex flex-wrap gap-2">
        {depth < maxDepth && (
          <button
            type="button"
            onClick={() => setReplyOpen(v => !v)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-pink-600 hover:text-pink-700"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {replyOpen ? 'Cancel' : 'Reply'}
          </button>
        )}
      </div>
      {replyOpen && depth < maxDepth && (
        <div className="px-3 pb-3 sm:px-4 border-t border-gray-100 pt-3">
          <ReplyForm
            topicId={topicId}
            parentId={node.id}
            onSuccess={() => {
              setReplyOpen(false)
              onPosted()
            }}
            placeholder={`Reply to ${node.author_label}…`}
          />
        </div>
      )}
      {node.children.length > 0 && (
        <ul className="mt-2 space-y-3 list-none pl-0 border-t border-gray-100 pt-3 px-1 sm:px-2 pb-2 bg-slate-50/50">
          {node.children.map(ch => (
            <ThreadNode
              key={ch.id}
              node={ch}
              topicId={topicId}
              depth={depth + 1}
              maxDepth={maxDepth}
              onPosted={onPosted}
            />
          ))}
        </ul>
      )}
    </li>
  )
}
