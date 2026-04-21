export interface DiscussionPostNode {
  id: string
  topic_id: string
  parent_id: string | null
  author_id: string
  body: string
  created_at: string
  updated_at: string
  author_label: string
  children: DiscussionPostNode[]
}

export function buildPostTree(
  posts: Omit<DiscussionPostNode, 'children'>[],
): DiscussionPostNode[] {
  const map = new Map<string, DiscussionPostNode>()
  for (const p of posts) {
    map.set(p.id, { ...p, children: [] })
  }
  const roots: DiscussionPostNode[] = []
  for (const p of posts) {
    const node = map.get(p.id)!
    if (p.parent_id && map.has(p.parent_id)) {
      map.get(p.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortByCreated = (a: DiscussionPostNode, b: DiscussionPostNode) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()

  const walk = (nodes: DiscussionPostNode[]) => {
    nodes.sort(sortByCreated)
    for (const n of nodes) walk(n.children)
  }
  walk(roots)
  return roots
}
