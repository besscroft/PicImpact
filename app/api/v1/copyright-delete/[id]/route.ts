import 'server-only'
import { deleteCopyright } from '~/server/lib/operate'
import { NextRequest } from 'next/server'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: number } },
) {
  const data = await deleteCopyright(params.id);
  return Response.json(data)
}