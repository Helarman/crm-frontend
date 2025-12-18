import { AccessCheck } from '@/components/AccessCheck';
import { RestaurantList } from '@/components/features/restaurant/RestaurantList';

export default function RestaurantsPage() {
  return (
    <AccessCheck allowedRoles={['MANAGER', 'SUPERVISOR']}>
        <RestaurantList />
    </AccessCheck>
  );
}