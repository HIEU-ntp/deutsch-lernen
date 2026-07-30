import type { Metadata } from 'next'

import { PlacementTest } from '@/components/placement-test'
import { Container, PageHeader } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { getPlacement } from '@/lib/content/loader'

export const metadata: Metadata = {
  title: 'Kiểm tra xếp lớp',
  description: 'Bài test ngắn để biết bạn nên bắt đầu từ cấp độ nào.',
}

export default async function PlacementPage() {
  await requireUser('/placement')
  const placement = getPlacement()

  return (
    <Container className="max-w-2xl">
      <PageHeader
        title="Kiểm tra xếp lớp"
        description={`${placement.questions.length} câu, từ dễ tới khó, khoảng 5 phút. Kết quả sẽ gợi ý cấp độ bạn nên bắt đầu — bạn vẫn có thể chọn cấp khác bất cứ lúc nào.`}
      />

      <PlacementTest questions={placement.questions} />
    </Container>
  )
}
