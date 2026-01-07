'use client'

import RedirectPage from "@/components/features/other/RedirectPage";

const DiscoutsPage = () => {
    return(
        <RedirectPage redirectSeconds={1} redirectTo="/loyality?tab=discounts" />
    )
}

export default DiscoutsPage;