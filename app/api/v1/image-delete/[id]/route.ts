import 'server-only'
import { deleteImage } from '~/server/lib/operate'
import { NextRequest } from 'next/server'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: number } },
) {
  const data = await deleteImage(params.id);
  return Response.json(data)
}