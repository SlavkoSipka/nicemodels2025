'use client'

import type { DiscussionPostNode } from '@/lib/discussion/tree'
import { useState } from 'react'
import ReplyForm from './ReplyForm'
import { MessageCircle, Pencil, Trash2, ChevronDown, ChevronUp, Check, X } from 'lucide-react'

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function isEdited(node: DiscussionPostNode) {
  if (!node.updated_at) return false
  return new Date(node.updated_at).getTime() - new Date(node.created_at).getTime() > 2000
}

export default function DiscussionThread({
  nodes,
  topicId,
  onPosted,
  isAdmin = false,
  maxDepth = 8,
}: {
  nodes: DiscussionPostNode[]
  topicId: string
  onPosted: () => void
  isAdmin?: boolean
  maxDepth?: number
}) {
  return (
    <div className="space-y-0">
      {nodes.map(node => (
        <ThreadNode
          key={node.id}
          node={node}
          topicId={topicId}
          depth={0}
          maxDepth={maxDepth}
          onPosted={onPosted}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  )
}

function ThreadNode({
  node,
  topicId,
  depth,
  maxDepth,
  onPosted,
  isAdmin,
}: {
  node: DiscussionPostNode
  topicId: string
  depth: number
  maxDepth: number
  onPosted: () => void
  isAdmin: boolean
}) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState('')
  const [saving, setSaving] = useState(false)

  const handleEdit = () => {
    const plain = node.body.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    setEditBody(plain)
    setEditing(true)
  }

  const saveEdit = async () => {
    if (!editBody.trim()) return
    setSaving(true)
    const safeHtml = `<p>${editBody.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')}</p>`
    await fetch('/api/admin/discussion-posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: node.id, body: safeHtml }),
    })
    setSaving(false)
    setEditing(false)
    onPosted()
  }

  const handleDelete = async () => {
    if (!confirm('Delete this post? It will be hidden from public view.')) return
    setSaving(true)
    await fetch('/api/admin/discussion-posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: node.id, is_deleted: true }),
    })
    setSaving(false)
    onPosted()
  }

  return (
    <div className={depth > 0 ? 'ml-4 sm:ml-6 border-l-2 border-gray-200 hover:border-pink-300 transition-colors' : ''}>
      <div className="py-3 px-3 sm:px-4">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            {node.author_label.charAt(0).toUpperCase()}
          </div>
          <span className="font-bold text-gray-900">{node.author_label}</span>
          <span className="text-gray-400">·</span>
          <time className="text-gray-400" dateTime={node.created_at}>
            {timeAgo(node.created_at)}
          </time>
          {isEdited(node) && (
            <span className="text-gray-400 italic text-[10px]">(edited)</span>
          )}
          {node.children.length > 0 && (
            <button
              type="button"
              onClick={() => setCollapsed(v => !v)}
              className="ml-auto inline-flex items-center gap-0.5 text-gray-400 hover:text-gray-600"
            >
              {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              {collapsed ? `${node.children.length} more` : 'collapse'}
            </button>
          )}
        </div>

        {editing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={editBody}
              onChange={e => setEditBody(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none resize-y text-gray-900"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveEdit}
                disabled={saving}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50"
              >
                <Check className="w-3 h-3" /> Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                <X className="w-3 h-3" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className="mt-1.5 prose prose-sm max-w-none text-gray-700 prose-p:my-1 prose-a:text-pink-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: node.body }}
          />
        )}

        {!editing && (
          <div className="flex items-center gap-3 mt-2">
            {depth < maxDepth && (
              <button
                type="button"
                onClick={() => setReplyOpen(v => !v)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-pink-600 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                {replyOpen ? 'Cancel' : 'Reply'}
              </button>
            )}
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={handleEdit}
                  disabled={saving}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </>
            )}
          </div>
        )}

        {replyOpen && depth < maxDepth && (
          <div className="mt-3 pl-1">
            <ReplyForm
              topicId={topicId}
              parentId={node.id}
              onSuccess={() => {
                setReplyOpen(false)
                onPosted()
              }}
              placeholder={`Reply to ${node.author_label}...`}
            />
          </div>
        )}
      </div>

      {!collapsed && node.children.length > 0 && (
        <div>
          {node.children.map(ch => (
            <ThreadNode
              key={ch.id}
              node={ch}
              topicId={topicId}
              depth={depth + 1}
              maxDepth={maxDepth}
              onPosted={onPosted}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  )
}
