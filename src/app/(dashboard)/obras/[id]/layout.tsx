interface ObraLayoutProps {
  children: React.ReactNode
  params:   Promise<{ id: string }>
}

export default async function ObraLayout({ children, params }: ObraLayoutProps) {
  const { id } = await params

  // Header will show real data once connected to tRPC
  void id

  return (
    <div className="flex flex-col h-full">
      {children}
    </div>
  )
}
