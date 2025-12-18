import { AccessCheck } from '@/components/AccessCheck';
import { NetworkList } from '@/components/features/network/NetworkList';

export default function NetworkPage() {
  return (
    <AccessCheck allowedRoles={['MANAGER', 'SUPERVISOR']}>
        <NetworkList/>
    </AccessCheck>
  );
}