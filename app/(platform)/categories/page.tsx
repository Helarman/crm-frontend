'use client'

import RedirectPage from "@/components/features/other/RedirectPage";

const CategoriesPage = () => {
    return(
        <RedirectPage redirectSeconds={1} redirectTo="/menu?tab=categories" />
    )
}

export default CategoriesPage;