
import { AccessCheck } from '@/components/AccessCheck';
import { RestaurantDetails } from '@/components/features/restaurant/RestaurantDetails';

export default async function RestaurantDetailPage({
  params
}) {
  return (
    <AccessCheck allowedRoles={['MANAGER', 'SUPERVISOR']}>
      <div className="container mx-auto py-8">
        <RestaurantDetails restaurantId={params.id} />
      </div>
    </AccessCheck>
  );
}