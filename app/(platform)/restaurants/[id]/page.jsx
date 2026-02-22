

import { AccessCheck } from '@/components/AccessCheck';
import { RestaurantDetails } from '@/components/features/restaurant/RestaurantDetails';

export default async function RestaurantDetailPage({
  params
}) {
  const { id } = await params;
  return (
    <AccessCheck allowedRoles={['MANAGER', 'SUPERVISOR']}>
      <RestaurantDetails restaurantId={id} />
    </AccessCheck>
  );
}