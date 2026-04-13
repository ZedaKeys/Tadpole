import { items } from '@/data/items';
import ItemDetailClientPage from './ClientPage';

export function generateStaticParams() {
  return items.map((i) => ({ itemId: i.id }));
}

export default async function ItemDetailPage({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  return <ItemDetailClientPage params={{ itemId }} />;
}
