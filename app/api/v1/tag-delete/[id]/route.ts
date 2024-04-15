import 'server-only'
import { deleteTag } from '~/server/lib/operate'
import { NextRequest } from 'next/server'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: number } },
) {
  const data = await deleteTag(params.id);
  return Response.json(data)
}