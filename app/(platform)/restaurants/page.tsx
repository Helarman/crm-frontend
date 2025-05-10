import { AccessCheck } from '@/components/AccessCheck';
import { RestaurantList } from '@/components/features/restaurant/RestaurantList';

export default function RestaurantsPage() {
  return (
    <AccessCheck allowedRoles={['MANAGER', 'SUPERVISOR']}>
      <div className="container mx-auto py-8">
        <RestaurantList />
      </div>
    </AccessCheck>
  );
}