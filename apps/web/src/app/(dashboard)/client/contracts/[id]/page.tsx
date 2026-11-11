import { ContractDetail } from "@/components/contract/contract-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientContractDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <ContractDetail contractId={id} role="client" />;
}
